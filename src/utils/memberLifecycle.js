const { PermissionFlagsBits, escapeMarkdown } = require('discord.js');
const config = require('../config');
const { createEmbed } = require('./embeds');
const logger = require('./logger');

async function assignAutomaticRole(member) {
  const roleId = member.user.bot ? config.botRoleId : config.memberRoleId;
  const roleKind = member.user.bot ? 'bot' : 'member';

  let role;
  try {
    role = member.guild.roles.cache.get(roleId) ?? (await member.guild.roles.fetch(roleId));
  } catch (error) {
    logger.error(`Could not fetch the configured ${roleKind} role ${roleId}.`, error);
    return;
  }

  if (!role) {
    logger.warn(`The configured ${roleKind} role ${roleId} does not exist in ${member.guild.name}.`);
    return;
  }

  const botMember = member.guild.members.me;
  if (!botMember) {
    logger.warn(`The bot member is unavailable in ${member.guild.name}; ${role.name} was not assigned.`);
    return;
  }

  if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
    logger.warn(`Missing Manage Roles in ${member.guild.name}; ${role.name} was not assigned.`);
    return;
  }

  if (role.managed || role.comparePositionTo(botMember.roles.highest) >= 0) {
    logger.warn(
      `Cannot assign ${role.name} in ${member.guild.name}; it is managed or not below the bot's highest role.`,
    );
    return;
  }

  try {
    await member.roles.add(role, `Automatic ${roleKind} role`);
    logger.info(`Assigned ${role.name} to ${member.user.tag} in ${member.guild.name}.`);
  } catch (error) {
    logger.error(`Failed to assign ${role.name} to ${member.user.tag}.`, error);
  }
}

async function getJoinLeaveChannel(guild) {
  try {
    const channel =
      guild.channels.cache.get(config.joinLeaveChannelId) ??
      (await guild.channels.fetch(config.joinLeaveChannelId));

    if (!channel || !channel.isTextBased() || typeof channel.send !== 'function') {
      logger.warn(
        `Join/leave channel ${config.joinLeaveChannelId} is missing or is not text-based in ${guild.name}.`,
      );
      return null;
    }

    return channel;
  } catch (error) {
    logger.error(`Could not fetch join/leave channel ${config.joinLeaveChannelId} in ${guild.name}.`, error);
    return null;
  }
}

async function sendJoinMessage(member) {
  const channel = await getJoinLeaveChannel(member.guild);
  if (!channel) return;

  const embed = createEmbed({
    description: `🛬 **Welcome <@${member.id}> to ${escapeMarkdown(member.guild.name)}!** 🎉`,
    color: config.successColor,
  });

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error(`Failed to send a join message for ${member.user.tag} in ${member.guild.name}.`, error);
  }
}

async function sendLeaveMessage(member) {
  const channel = await getJoinLeaveChannel(member.guild);
  if (!channel) return;

  const displayName = escapeMarkdown(member.displayName || member.user.username);
  const guildName = escapeMarkdown(member.guild.name);
  const embed = createEmbed({
    description: `🛫 **${displayName}** has left **${guildName}**.`,
    color: config.errorColor,
  });

  try {
    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error(`Failed to send a leave message for ${member.user.tag} in ${member.guild.name}.`, error);
  }
}

module.exports = { assignAutomaticRole, sendJoinMessage, sendLeaveMessage };
