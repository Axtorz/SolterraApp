const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { successEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const { buildAuditReason } = require('../../utils/moderation');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

const DISCORD_ID_PATTERN = /^\d{17,20}$/;

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.BanMembers],
  requiredBotPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user by Discord user ID.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('user_id')
        .setDescription('The Discord ID of the banned user.')
        .setMinLength(17)
        .setMaxLength(20)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the unban.')
        .setMaxLength(400)
        .setRequired(true),
    ),

  async execute(interaction) {
    const userId = interaction.options.getString('user_id', true).trim();
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;

    if (!DISCORD_ID_PATTERN.test(userId)) {
      return replyWithError(interaction, 'Enter a valid Discord user ID.', 'Invalid user ID');
    }

    const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      return replyWithError(interaction, 'No active ban was found for that user ID.', 'Ban not found');
    }

    await interaction.guild.members.unban(userId, buildAuditReason(interaction, reason));
    const embed = successEmbed(
      '✅ User unbanned',
      `**${ban.user.tag}** was unbanned.\n**Reason:** ${truncate(reason, 400)}`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
