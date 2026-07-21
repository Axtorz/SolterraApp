const { SlashCommandBuilder } = require('discord.js');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  category: 'Information',
  requiredUserPermissions: [],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot and Discord connection latency.')
    .setDMPermission(false),

  async execute(interaction) {
    await interaction.reply({
      embeds: [infoEmbed('🏓 Pong!', 'Measuring latency…')],
    });

    const responseLatency = Date.now() - interaction.createdTimestamp;
    const websocketLatency = Math.max(0, Math.round(interaction.client.ws.ping));

    await interaction.editReply({
      embeds: [
        infoEmbed(
          '🏓 Pong!',
          `**WebSocket latency:** ${websocketLatency} ms\n**Interaction response:** ${responseLatency} ms`,
        ),
      ],
    });
  },
};
