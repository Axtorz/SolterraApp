const {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { validateDestinationChannel } = require('../../utils/channelPermissions');
const { parseEmbedColor } = require('../../utils/colors');
const { createEmbed, successEmbed } = require('../../utils/embeds');
const { expandNewlines } = require('../../utils/formatters');
const logger = require('../../utils/logger');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

function parseImageUrl(value) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

module.exports = {
  category: 'Administration',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.Administrator],
  requiredBotPermissions: [],
  data: new SlashCommandBuilder()
    .setName('sayembed')
    .setDescription('Send a customized embed in a selected channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('The channel where the embed will be sent.')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('The main text of the embed.')
        .setMinLength(1)
        .setMaxLength(3_500)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('An optional embed title.')
        .setMaxLength(256)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('color')
        .setDescription('A hex color or purple, green, red, orange, yellow, blue, pink, white, or black.')
        .setMaxLength(16)
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('timestamp')
        .setDescription('Display the current date and time on the embed.')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('footer')
        .setDescription('Optional text displayed at the bottom of the embed.')
        .setMaxLength(1_000)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('image_url')
        .setDescription('Optional HTTP or HTTPS URL for a large image.')
        .setMaxLength(1_000)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('thumbnail_url')
        .setDescription('Optional HTTP or HTTPS URL for a thumbnail.')
        .setMaxLength(1_000)
        .setRequired(false),
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const description = expandNewlines(interaction.options.getString('description', true));
    const title = interaction.options.getString('title')?.trim();
    const colorInput = interaction.options.getString('color');
    const includeTimestamp = interaction.options.getBoolean('timestamp') ?? false;
    const footer = interaction.options.getString('footer')?.trim();
    const imageInput = interaction.options.getString('image_url');
    const thumbnailInput = interaction.options.getString('thumbnail_url');
    const channelError = validateDestinationChannel(channel, interaction.guild.members.me, {
      embeds: true,
    });

    if (channelError) return replyWithError(interaction, channelError, 'Embed not sent');
    if (!description.trim()) {
      return replyWithError(interaction, 'The description cannot contain only spaces.', 'Invalid description');
    }

    const color = parseEmbedColor(colorInput);
    if (color === null) {
      return replyWithError(
        interaction,
        'Use a six-digit hex value such as `#8B5CF6`, or a supported color name.',
        'Invalid color',
      );
    }

    const imageUrl = parseImageUrl(imageInput);
    const thumbnailUrl = parseImageUrl(thumbnailInput);
    if (imageInput && !imageUrl) {
      return replyWithError(interaction, 'Enter a valid HTTP or HTTPS image URL.', 'Invalid image URL');
    }
    if (thumbnailInput && !thumbnailUrl) {
      return replyWithError(
        interaction,
        'Enter a valid HTTP or HTTPS thumbnail URL.',
        'Invalid thumbnail URL',
      );
    }

    const embed = createEmbed({
      title,
      description,
      color,
      timestamp: includeTimestamp,
    });

    if (footer) embed.setFooter({ text: footer });
    if (imageUrl) embed.setImage(imageUrl);
    if (thumbnailUrl) embed.setThumbnail(thumbnailUrl);

    const sentMessage = await channel.send({ embeds: [embed] });
    logger.info(
      `${interaction.user.tag} (${interaction.user.id}) used /sayembed in ${channel.name} (${channel.id}); message ${sentMessage.id}.`,
    );

    return replyWithEmbed(
      interaction,
      successEmbed('✅ Embed sent', `The embed was sent in ${channel}.\n[Open message](${sentMessage.url})`),
      { ephemeral: true },
    );
  },
};
