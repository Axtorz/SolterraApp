const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { replyWithEmbed } = require('../../utils/responses');

const VERIFICATION_LEVELS = ['None', 'Low', 'Medium', 'High', 'Very High'];
const BOOST_TIERS = ['None', 'Tier 1', 'Tier 2', 'Tier 3'];

module.exports = {
  category: 'Information',
  defer: true,
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Show information about this Discord server.')
    .setDMPermission(false),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner().catch(() => null);
    const botCount = guild.members.cache.filter((member) => member.user.bot).size;
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    const embed = infoEmbed(`🏰 ${guild.name}`, `Server information for **${guild.name}**.`).addFields(
      {
        name: 'Overview',
        value: [
          `**Owner:** ${owner ? `${owner.user.tag} (${owner.id})` : 'Unavailable'}`,
          `**Server ID:** ${guild.id}`,
          `**Created:** <t:${createdTimestamp}:F>`,
          `**Locale:** ${guild.preferredLocale}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Community',
        value: [
          `**Members:** ${guild.memberCount}`,
          `**Cached bots:** ${botCount}`,
          `**Roles:** ${Math.max(0, guild.roles.cache.size - 1)}`,
          `**Channels:** ${guild.channels.cache.size}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: 'Boosts and Security',
        value: [
          `**Boosts:** ${guild.premiumSubscriptionCount ?? 0}`,
          `**Boost tier:** ${BOOST_TIERS[guild.premiumTier] ?? guild.premiumTier}`,
          `**Verification level:** ${VERIFICATION_LEVELS[guild.verificationLevel] ?? guild.verificationLevel}`,
        ].join('\n'),
      },
    );

    const iconUrl = guild.iconURL({ size: 512 });
    if (iconUrl) embed.setThumbnail(iconUrl);
    if (guild.description) embed.setDescription(guild.description);

    return replyWithEmbed(interaction, embed);
  },
};
