const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { truncate } = require('../../utils/formatters');
const { fetchGuildMember } = require('../../utils/moderation');
const { replyWithEmbed } = require('../../utils/responses');

module.exports = {
  category: 'Information',
  defer: true,
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Show information about a server member.')
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The member to inspect. Defaults to you.')
        .setRequired(false),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const member = await fetchGuildMember(interaction.guild, user.id);
    const createdTimestamp = Math.floor(user.createdTimestamp / 1000);
    const roles = member
      ? member.roles.cache
          .filter((role) => role.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map((role) => role.toString())
      : [];

    const embed = infoEmbed(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 512 }))
      .addFields(
        {
          name: 'Account',
          value: [
            `**Username:** ${user.username}`,
            `**User ID:** ${user.id}`,
            `**Type:** ${user.bot ? 'Bot' : 'User'}`,
            `**Created:** <t:${createdTimestamp}:F>`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'Server Membership',
          value: member
            ? [
                `**Display name:** ${member.displayName}`,
                `**Joined:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`,
                `**Timed out:** ${member.isCommunicationDisabled() ? 'Yes' : 'No'}`,
              ].join('\n')
            : 'This user is not currently in the server.',
          inline: true,
        },
        {
          name: `Roles (${roles.length})`,
          value: roles.length > 0 ? truncate(roles.join(', '), 1_000) : 'No assigned roles.',
        },
      );

    return replyWithEmbed(interaction, embed);
  },
};
