const { PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const { moderationEmbed } = require('../../utils/embeds');
const { replyWithEmbed, replyWithError } = require('../../utils/responses');

module.exports = {
  category: 'Moderation',
  defer: 'ephemeral',
  requiredUserPermissions: [PermissionFlagsBits.ManageMessages],
  requiredBotPermissions: [
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ReadMessageHistory,
  ],
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete recent messages from the current channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option
        .setName('amount')
        .setDescription('The number of messages to delete, from 1 to 100.')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true),
    )
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user.')
        .setRequired(false),
    ),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;

    if (!channel?.messages || typeof channel.bulkDelete !== 'function') {
      return replyWithError(
        interaction,
        'Messages cannot be bulk-deleted in this channel.',
        'Unsupported channel',
      );
    }

    const fetched = await channel.messages.fetch({ limit: 100 });
    const matches = user ? fetched.filter((message) => message.author.id === user.id) : fetched;
    const selected = matches.first(amount);

    if (selected.length === 0) {
      return replyWithError(interaction, 'No matching recent messages were found.', 'Nothing to delete');
    }

    const deleted = await channel.bulkDelete(selected, true);
    const tooOld = selected.length - deleted.size;
    const unavailable = amount - selected.length;
    const details = [`Deleted **${deleted.size}** message(s)${user ? ` from **${user.tag}**` : ''}.`];

    if (tooOld > 0) {
      details.push(`Skipped **${tooOld}** message(s) older than Discord's 14-day bulk-delete limit.`);
    }
    if (unavailable > 0) {
      details.push(`Only **${selected.length}** matching message(s) were found among the latest 100.`);
    }

    return replyWithEmbed(interaction, moderationEmbed('🧹 Messages cleared', details.join('\n')), {
      ephemeral: true,
    });
  },
};
