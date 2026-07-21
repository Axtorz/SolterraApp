const config = require('../config');

const NAMED_COLORS = Object.freeze({
  purple: config.accentColor,
  green: config.successColor,
  red: config.errorColor,
  orange: config.warningColor,
  yellow: 0xfacc15,
  blue: 0x3b82f6,
  pink: 0xec4899,
  white: 0xffffff,
  black: 0x000000,
});

/**
 * Converts a supported color name or six-digit hexadecimal value to a Discord color integer.
 */
function parseEmbedColor(input) {
  if (!input) return config.accentColor;

  const normalized = input.trim().toLowerCase();
  if (Object.hasOwn(NAMED_COLORS, normalized)) return NAMED_COLORS[normalized];

  const match = normalized.match(/^(?:#|0x)?([0-9a-f]{6})$/i);
  return match ? Number.parseInt(match[1], 16) : null;
}

module.exports = { NAMED_COLORS, parseEmbedColor };
