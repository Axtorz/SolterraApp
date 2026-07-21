const { EmbedBuilder } = require('discord.js');
const config = require('../config');

const createEmbed = ({ title, description, color = config.accentColor, timestamp = true }) => {
  const embed = new EmbedBuilder().setColor(color);

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (timestamp) embed.setTimestamp();

  return embed;
};

const infoEmbed = (title, description) =>
  createEmbed({ title, description, color: config.accentColor });

const successEmbed = (title, description) =>
  createEmbed({ title, description, color: config.successColor });

const errorEmbed = (title, description) =>
  createEmbed({ title, description, color: config.errorColor });

const moderationEmbed = (title, description) =>
  createEmbed({ title, description, color: config.errorColor });

const warningEmbed = (title, description) =>
  createEmbed({ title, description, color: config.warningColor });

module.exports = {
  createEmbed,
  errorEmbed,
  infoEmbed,
  moderationEmbed,
  successEmbed,
  warningEmbed,
};
