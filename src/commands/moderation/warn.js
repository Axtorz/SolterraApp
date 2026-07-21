const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { warningEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const { fetchGuildMember, validateModerationTarget } = require('../../utils/moderation');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');
const { addWarning } = require('../../utils/warningStore');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Add a warning to a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member to warn.').setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for the warning.')
        .setMaxLength(800)
        .setRequired(true),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true).trim() || config.settings.defaultReason;
    const member = await fetchGuildMember(interaction.guild, user.id);
    const targetError = validateModerationTarget(interaction, member, 'warn');

    if (targetError) return replyWithError(interaction, targetError, 'Warning blocked');

    const warning = await addWarning({
      userId: user.id,
      moderatorId: interaction.user.id,
      reason,
    });

    const embed = warningEmbed(
      '⚠️ Member warned',
      `**${user.tag}** received a warning.\n**Reason:** ${truncate(reason, 800)}\n**Warning ID:** \`${warning.id}\``,
    );
    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
