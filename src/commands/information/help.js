const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { missingPermissions } = require('../../utils/permissions');
const { replyWithEmbed } = require('../../utils/responses');

const CATEGORY_ORDER = ['Information', 'Fun', 'Moderation'];

module.exports = {
  category: 'Information',
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show the commands available to you.')
    .setDMPermission(false),

  async execute(interaction) {
    const grouped = new Map();

    for (const command of interaction.client.commands.values()) {
      if (missingPermissions(interaction.memberPermissions, command.requiredUserPermissions).length > 0) {
        continue;
      }

      const category = command.category ?? 'Other';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(command);
    }

    const categories = [...grouped.keys()].sort((a, b) => {
      const aIndex = CATEGORY_ORDER.indexOf(a);
      const bIndex = CATEGORY_ORDER.indexOf(b);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex) || a.localeCompare(b);
    });

    const embed = infoEmbed('📖 Solterra Commands', 'Only commands available to you are shown.');

    for (const category of categories) {
      const lines = grouped
        .get(category)
        .sort((a, b) => a.data.name.localeCompare(b.data.name))
        .map((command) => `\`/${command.data.name}\` — ${command.data.description}`);

      embed.addFields({ name: category, value: lines.join('\n') });
    }

    return replyWithEmbed(interaction, embed);
  },
};
