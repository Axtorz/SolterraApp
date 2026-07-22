const net = require('node:net');
const config = require('../config');
const { validateDestinationChannel } = require('./channelPermissions');
const { createEmbed } = require('./embeds');
const JsonStore = require('./jsonStore');
const logger = require('./logger');

const DEFAULT_STATE = Object.freeze({
  version: 1,
  status: null,
  updatedAt: null,
});

const isValidState = (data) =>
  data !== null &&
  typeof data === 'object' &&
  !Array.isArray(data) &&
  data.version === 1 &&
  [null, 'online', 'offline'].includes(data.status) &&
  (data.updatedAt === null || typeof data.updatedAt === 'string');

const statusStore = new JsonStore(config.paths.minecraftStatus, DEFAULT_STATE, isValidState);

let monitorStarted = false;
let lastAnnouncedStatus = null;
let consecutiveFailures = 0;
let announcementErrorLogged = false;

function probeMinecraftServer() {
  const { host, port, connectionTimeoutMs } = config.minecraftServer;

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (online) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(online);
    };

    socket.setTimeout(connectionTimeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect({ host, port });
  });
}

function logAnnouncementError(message, error) {
  if (announcementErrorLogged) return;
  announcementErrorLogged = true;

  if (error) logger.error(message, error);
  else logger.warn(message);
}

async function announceStatus(client, status) {
  const { statusChannelId } = config.minecraftServer;

  try {
    const channel =
      client.channels.cache.get(statusChannelId) ?? (await client.channels.fetch(statusChannelId));

    if (!channel?.isTextBased() || typeof channel.send !== 'function') {
      logAnnouncementError(
        `Minecraft status channel ${statusChannelId} is missing or cannot receive messages.`,
      );
      return false;
    }

    const permissionError = validateDestinationChannel(channel, channel.guild?.members.me, {
      embeds: true,
    });
    if (permissionError) {
      logAnnouncementError(`Minecraft status notification blocked: ${permissionError}`);
      return false;
    }

    const online = status === 'online';
    const embed = createEmbed({
      title: online ? '🟢 Minecraft Server Online' : '🔴 Minecraft Server Offline',
      description: online
        ? '✅ **The Minecraft server is online.**'
        : '❌ **The Minecraft server is offline.**',
      color: online ? config.successColor : config.errorColor,
    });

    await channel.send({ embeds: [embed] });
    announcementErrorLogged = false;
    logger.info(`Minecraft server status changed to ${status}; notification sent in ${channel.id}.`);
    return true;
  } catch (error) {
    logAnnouncementError(`Could not send Minecraft status to channel ${statusChannelId}.`, error);
    return false;
  }
}

async function saveAnnouncedStatus(status) {
  await statusStore.update((data) => {
    data.version = 1;
    data.status = status;
    data.updatedAt = new Date().toISOString();
  });
}

function scheduleNextCheck(client) {
  const timeout = setTimeout(() => {
    void runCheck(client);
  }, config.minecraftServer.checkIntervalMs);
  timeout.unref();
}

async function runCheck(client) {
  try {
    const online = await probeMinecraftServer();

    if (online) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures += 1;
      if (consecutiveFailures < config.minecraftServer.offlineFailureThreshold) return;
    }

    const currentStatus = online ? 'online' : 'offline';
    if (currentStatus === lastAnnouncedStatus) return;

    const announced = await announceStatus(client, currentStatus);
    if (!announced) return;

    lastAnnouncedStatus = currentStatus;
    await saveAnnouncedStatus(currentStatus).catch((error) => {
      logger.error('Could not persist the announced Minecraft server status.', error);
    });
  } catch (error) {
    logger.error('Unexpected Minecraft status monitor failure.', error);
  } finally {
    scheduleNextCheck(client);
  }
}

async function startMinecraftStatusMonitor(client) {
  if (monitorStarted) return;
  monitorStarted = true;

  try {
    const storedState = await statusStore.read();
    lastAnnouncedStatus = storedState.status;
  } catch (error) {
    logger.error('Could not load the previous Minecraft server status.', error);
  }

  const { host, port, checkIntervalMs, offlineFailureThreshold } = config.minecraftServer;
  logger.info(
    `Monitoring Minecraft service ${host}:${port} every ${checkIntervalMs / 1_000} seconds; ` +
      `${offlineFailureThreshold} failed checks are required before an offline alert.`,
  );
  await runCheck(client);
}

module.exports = { probeMinecraftServer, startMinecraftStatusMonitor };
