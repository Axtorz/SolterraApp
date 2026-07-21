const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { warningEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');
const { getWarningsForUser } = require('../../utils/warningStore');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.ModerateMembers],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View the stored warnings for a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) =>
      option.setName('user').setDescription('The member whose warnings to view.').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('page').setDescription('The page to display.').setMinValue(1).setRequired(false),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const warnings = await getWarningsForUser(user.id);

    if (warnings.length === 0) {
      return replyWithError(interaction, `**${user.tag}** has no stored warnings.`, 'No warnings');
    }

    const pageSize = config.settings.warningsPerPage;
    const pageCount = Math.ceil(warnings.length / pageSize);
    const page = interaction.options.getInteger('page') ?? 1;

    if (page > pageCount) {
      return replyWithError(
        interaction,
        `Choose a page between **1** and **${pageCount}**.`,
        'Page not found',
      );
    }

    const startIndex = (page - 1) * pageSize;
    const entries = warnings.slice(startIndex, startIndex + pageSize);
    const embed = warningEmbed(
      `⚠️ Warnings for ${user.tag}`,
      `Stored warnings: **${warnings.length}**`,
    )
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setFooter({ text: `Page ${page} of ${pageCount}` });

    for (const [index, warning] of entries.entries()) {
      const unixTime = Math.floor(Date.parse(warning.timestamp) / 1000);
      const timeLabel = Number.isFinite(unixTime) ? `<t:${unixTime}:f>` : 'Unknown time';
      embed.addFields({
        name: `Warning ${startIndex + index + 1} • ${timeLabel}`,
        value: `**ID:** \`${warning.id}\`\n**Moderator:** <@${warning.moderatorId}>\n**Reason:** ${truncate(warning.reason, 350)}`,
      });
    }

    return replyWithEmbed(interaction, embed, { ephemeral: true });
  },
};
