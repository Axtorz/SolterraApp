require('dotenv').config({ quiet: true });

const { Collection, REST, Routes } = require('discord.js');
const { loadCommands } = require('../src/handlers/commandHandler');
const logger = require('../src/utils/logger');

const requiredEnvironmentVariables = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingVariables = requiredEnvironmentVariables.filter((name) => !process.env[name]?.trim());

if (missingVariables.length > 0) {
  logger.error(`Missing environment variables: ${missingVariables.join(', ')}.`);
  process.exitCode = 1;
} else {
  (async () => {
    try {
      const holder = { commands: new Collection() };
      loadCommands(holder);
      const payload = holder.commands.map((command) => command.data.toJSON());
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      logger.info(`Deploying ${payload.length} guild slash commands.`);
      const deployed = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: payload },
      );
      logger.info(`Successfully deployed ${deployed.length} slash commands.`);
    } catch (error) {
      logger.error('Slash-command deployment failed.', error);
      process.exitCode = 1;
    }
  })();
}
