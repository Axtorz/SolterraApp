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
  requiredUserPermissions: [PermissionFlagsBits.KickMembers],
  requiredBotPermissions: [PermissionFlagsBits.KickMembers],
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to kick.').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the kick.')
        .setMaxLength(400)
        .setRequired(true),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;
    const member = await fetchGuildMember(interaction.guild, user.id);
    const targetError = validateModerationTarget(interaction, member, 'kick');

    if (targetError) return replyWithError(interaction, targetError, 'Kick blocked');

    await member.kick(buildAuditReason(interaction, reason));
    const embed = moderationEmbed(
      '👢 Member kicked',
      `**${user.tag}** was kicked.\n**Reason:** ${truncate(reason, 400)}`,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
