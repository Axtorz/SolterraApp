const { truncate } = require('./formatters');

async function fetchGuildMember(guild, userId) {
  return guild.members.fetch(userId).catch(() => null);
}

function validateModerationTarget(interaction, target, action) {
  const moderator = interaction.member;
  const botMember = interaction.guild.members.me;

  if (!target) return 'That user is not a member of this server.';
  if (!moderator || !botMember) return 'Member information is currently unavailable.';
  if (target.id === interaction.user.id) return `You cannot ${action} yourself.`;
  if (target.id === interaction.guild.ownerId) return `You cannot ${action} the server owner.`;

  if (
    interaction.user.id !== interaction.guild.ownerId &&
    target.roles.highest.comparePositionTo(moderator.roles.highest) >= 0
  ) {
    return `You cannot ${action} a member whose highest role is equal to or above yours.`;
  }

  if (target.roles.highest.comparePositionTo(botMember.roles.highest) >= 0) {
    return `I cannot ${action} a member whose highest role is equal to or above mine.`;
  }

  const capability = {
    ban: target.bannable,
    kick: target.kickable,
    mute: target.moderatable,
    unmute: target.moderatable,
    warn: true,
  }[action];

  if (capability === false) return `Discord does not allow me to ${action} that member.`;
  return null;
}

function buildAuditReason(interaction, reason) {
  return truncate(`${reason} | Moderator: ${interaction.user.tag} (${interaction.user.id})`, 512);
}

module.exports = { buildAuditReason, fetchGuildMember, validateModerationTarget };
