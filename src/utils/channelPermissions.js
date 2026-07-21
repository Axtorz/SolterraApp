const { PermissionFlagsBits } = require('discord.js');
const { formatPermissionList, missingPermissions } = require('./permissions');

function validateDestinationChannel(channel, botMember, { embeds = false } = {}) {
  if (!channel?.isTextBased() || typeof channel.send !== 'function') {
    return 'The selected channel cannot receive messages.';
  }

  if (!botMember) return 'My server member information is currently unavailable.';

  const requiredPermissions = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];
  if (embeds) requiredPermissions.push(PermissionFlagsBits.EmbedLinks);

  const missing = missingPermissions(channel.permissionsFor(botMember), requiredPermissions);
  if (missing.length > 0) {
    return `I need the following permission(s) in ${channel}: **${formatPermissionList(missing)}**.`;
  }

  return null;
}

module.exports = { validateDestinationChannel };
