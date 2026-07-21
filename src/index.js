require('dotenv').config({ quiet: true });

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const logger = require('./utils/logger');

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection.', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception. The process will stop so it can restart safely.', error);
  process.exit(1);
});

const requiredEnvironmentVariables = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingVariables = requiredEnvironmentVariables.filter((name) => !process.env[name]?.trim());

if (missingVariables.length > 0) {
  logger.error(`Missing environment variables: ${missingVariables.join(', ')}.`);
  process.exitCode = 1;
} else {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  });

  client.commands = new Collection();

  try {
    loadCommands(client);
    loadEvents(client);

    client.login(process.env.DISCORD_TOKEN).catch((error) => {
      logger.error('Discord login failed.', error);
      process.exitCode = 1;
    });
  } catch (error) {
    logger.error('Bot startup failed.', error);
    process.exitCode = 1;
  }
}
