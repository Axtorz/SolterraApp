const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { validateDestinationChannel } = require('../../utils/channelPermissions');
const { successEmbed } = require('../../utils/embeds');
const logger = require('../../utils/logger');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

module.exports = {
  category: 'Administration',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.Administrator],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message in a selected channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel where the message will be sent.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message for the bot to send.')
        .setMinLength(1)
        .setMaxLength(2_000)
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName('allow_mentions')
        .setDescription('Allow the message to notify mentioned users, roles, or everyone.')
        .setRequired(false),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const message = interaction.options.getString('message', true);
    const allowMentions = interaction.options.getBoolean('allow_mentions') ?? false;
    const channelError = validateDestinationChannel(channel, interaction.guild.members.me);

    if (channelError) return replyWithError(interaction, channelError, 'Message not sent');
    if (!message.trim()) {
      return replyWithError(interaction, 'The message cannot contain only spaces.', 'Invalid message');
    }

    const sentMessage = await channel.send({
      content: message,
      allowedMentions: {
        parse: allowMentions ? ['users', 'roles', 'everyone'] : [],
      },
    });

    logger.info(
      `${interaction.user.tag} (${interaction.user.id}) used /say in ${channel.name} (${channel.id}); message ${sentMessage.id}.`,
    );

    return replyWithEmbed(
      interaction,
      successEmbed('✅ Message sent', `The message was sent in ${channel}.\n[Open message](${sentMessage.url})`),
      { ephemeral: true },
    );
  },
};
