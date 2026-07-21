const UNITS = Object.freeze({
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
});

/**
 * Parses compact durations such as 10m, 2h, 1d, or 1d12h.
 * Returns null when any part of the input is invalid.
 */
function parseDuration(input) {
  if (typeof input !== 'string') return null;

  const normalized = input.toLowerCase().replace(/\s+/g, '');
  if (!normalized) return null;

  const pattern = /(\d+)([smhdw])/g;
  let total = 0;
  let consumed = '';
  let match;

  while ((match = pattern.exec(normalized)) !== null) {
    const amount = Number(match[1]);
    if (!Number.isSafeInteger(amount) || amount <= 0) return null;
    total += amount * UNITS[match[2]];
    consumed += match[0];
  }

  if (consumed !== normalized || !Number.isSafeInteger(total) || total <= 0) return null;
  return total;
}

module.exports = { parseDuration };
