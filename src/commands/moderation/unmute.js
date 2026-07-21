const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { successEmbed } = require('../../utils/embeds');
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
  requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
  requiredBotPermissions: [PermissionFlagsBits.ModerateMembers],
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription("Remove a member's Discord timeout.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to unmute.').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for removing the timeout.')
        .setMaxLength(400)
        .setRequired(true),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;
    const member = await fetchGuildMember(interaction.guild, user.id);
    const targetError = validateModerationTarget(interaction, member, 'unmute');

    if (targetError) return replyWithError(interaction, targetError, 'Unmute blocked');
    if (!member.isCommunicationDisabled()) {
      return replyWithError(interaction, 'That member is not currently timed out.', 'No active timeout');
    }

    await member.timeout(null, buildAuditReason(interaction, reason));
    const embed = successEmbed(
      '🔊 Member unmuted',
      `The timeout for **${user.tag}** was removed.\n**Reason:** ${truncate(reason, 400)}`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
