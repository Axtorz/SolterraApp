const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { moderationEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const {
  buildAuditReason,
  fetchGuildMember,
  validateModerationTarget,
} = require('../../utils/moderation');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.BanMembers],
  requiredBotPermissions: [PermissionFlagsBits.BanMembers],
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to ban.').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the ban.')
        .setMaxLength(400)
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('recent_message_seconds')
        .setDescription('Recent message history to delete, from 0 to 604800 seconds.')
        .setMinValue(0)
        .setMaxValue(604_800)
        .setRequired(false),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;
    const deleteMessageSeconds = interaction.options.getInteger('recent_message_seconds') ?? 0;
    const member = await fetchGuildMember(interaction.guild, user.id);
    const targetError = validateModerationTarget(interaction, member, 'ban');

    if (targetError) return replyWithError(interaction, targetError, 'Ban blocked');

    await member.ban({
      deleteMessageSeconds,
      reason: buildAuditReason(interaction, reason),
    });

    const embed = moderationEmbed(
      '🔨 Member banned',
      `**${user.tag}** was banned.\n**Reason:** ${truncate(reason, 400)}\n**Messages removed:** ${deleteMessageSeconds} second(s)`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
