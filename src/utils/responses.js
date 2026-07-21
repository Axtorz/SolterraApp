const { MessageFlags } = require('discord.js');
const { errorEmbed } = require('./embeds');
const logger = require('./logger');

/**
 * Sends an embed regardless of whether an interaction is new, deferred, or replied to.
 * Ephemeral state can only be selected for the initial response.
 */
async function replyWithEmbed(interaction, embed, { ephemeral = false } = {}) {
  const payload = { embeds: [embed] };

  if (interaction.deferred) {
    return interaction.editReply(payload);
  }

  if (interaction.replied) {
    if (ephemeral) payload.flags = MessageFlags.Ephemeral;
    return interaction.followUp(payload);
  }

  if (ephemeral) payload.flags = MessageFlags.Ephemeral;
  return interaction.reply(payload);
}

async function replyWithError(interaction, description, title = 'Something went wrong') {
  try {
    return await replyWithEmbed(interaction, errorEmbed(`❌ ${title}`, description), {
      ephemeral: true,
    });
  } catch (error) {
    logger.error(`Could not send an error response for interaction ${interaction.id}.`, error);
    return null;
  }
}

module.exports = { replyWithEmbed, replyWithError };
