const { Events, MessageFlags } = require('discord.js');
const { formatPermissionList, missingPermissions } = require('../utils/permissions');
const { replyWithError } = require('../utils/responses');
const logger = require('../utils/logger');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Received unknown slash command /${interaction.commandName}.`);
      await replyWithError(
        interaction,
        'This command is not loaded. Ask an administrator to redeploy the slash commands.',
        'Unknown command',
      );
      return;
    }

    if (command.guildOnly !== false && !interaction.inGuild()) {
      await replyWithError(interaction, 'This command can only be used inside a server.', 'Server only');
      return;
    }

    const missingUserPermissions = missingPermissions(
      interaction.memberPermissions,
      command.requiredUserPermissions,
    );

    if (missingUserPermissions.length > 0) {
      await replyWithError(
        interaction,
        `You need the following permission(s): **${formatPermissionList(missingUserPermissions)}**.`,
        'Missing permissions',
      );
      return;
    }

    const missingBotPermissions = missingPermissions(
      interaction.appPermissions,
      command.requiredBotPermissions,
    );

    if (missingBotPermissions.length > 0) {
      await replyWithError(
        interaction,
        `I need the following permission(s): **${formatPermissionList(missingBotPermissions)}**.`,
        'Missing bot permissions',
      );
      return;
    }

    try {
      if (command.defer === 'ephemeral') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      } else if (command.defer) {
        await interaction.deferReply();
      }

      await command.execute(interaction);
    } catch (error) {
      logger.error(
        `Command /${interaction.commandName} failed for ${interaction.user.tag} (${interaction.user.id}).`,
        error,
      );
      await replyWithError(
        interaction,
        'The command could not be completed. Please try again later.',
        'Command failed',
      );
    }
  },
};
