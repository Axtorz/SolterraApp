const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { successEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');
const { removeWarning } = require('../../utils/warningStore');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a stored warning by its unique ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('warning_id')
        .setDescription('The unique warning ID to remove.')
        .setMinLength(1)
        .setMaxLength(64)
        .setRequired(true),
    ),

  async execute(interaction) {
    const warningId = interaction.options.getString('warning_id', true).trim();
    const warning = await removeWarning(warningId);

    if (!warning) {
      return replyWithError(interaction, 'No warning was found with that ID.', 'Warning not found');
    }

    const embed = successEmbed(
      '✅ Warning removed',
      `Removed warning \`${warning.id}\` from <@${warning.userId}>.\n**Reason:** ${truncate(warning.reason, 700)}`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
