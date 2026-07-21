const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { parseDuration } = require('../../utils/duration');
const { moderationEmbed } = require('../../utils/embeds');
const { formatDuration, truncate } = require('../../utils/formatters');
const {
  buildAuditReason,
  fetchGuildMember,
  validateModerationTarget,
} = require('../../utils/moderation');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
  requiredBotPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription("Temporarily mute a member with Discord's timeout system.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to mute.').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('duration')
        .setDescription('A duration such as 10m, 2h, 1d, or 7d.')
        .setMaxLength(32)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the timeout.')
        .setMaxLength(400)
        .setRequired(true),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const durationInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;
    const duration = parseDuration(durationInput);

    if (!duration) {
      return replyWithError(
        interaction,
        'Use a duration such as `10m`, `2h`, `1d`, or `7d`.',
        'Invalid duration',
      );
    }

    if (duration > config.settings.maximumTimeoutMs) {
      return replyWithError(
        interaction,
        `Discord timeouts cannot exceed **${formatDuration(config.settings.maximumTimeoutMs)}**.`,
        'Duration too long',
      );
    }

    const member = await fetchGuildMember(interaction.guild, user.id);
    const targetError = validateModerationTarget(interaction, member, 'mute');
    if (targetError) return replyWithError(interaction, targetError, 'Mute blocked');

    await member.timeout(duration, buildAuditReason(interaction, reason));
    const embed = moderationEmbed(
      '🔇 Member muted',
      `**${user.tag}** was muted for **${formatDuration(duration)}**.\n**Reason:** ${truncate(reason, 400)}`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
