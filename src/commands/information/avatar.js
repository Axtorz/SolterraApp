const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');
const { replyWithEmbed } = require('../../utils/responses');

module.exports = {
  category: 'Information',
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription("Display a user's avatar in high resolution.")
    .setDMPermission(false)
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose avatar to display. Defaults to you.')
        .setRequired(false),
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') ?? interaction.user;
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 4096, forceStatic: false });
    const embed = infoEmbed(`🖼️ ${user.username}'s Avatar`, `[Open original image](${avatarUrl})`)
      .setImage(avatarUrl);

    return replyWithEmbed(interaction, embed);
  },
};
