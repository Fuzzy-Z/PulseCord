/**
 * Utility functions to encode and decode PulseCord / Voxel server invite codes
 */

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const generateSalt = (len = 2) => {
  let salt = '';
  for (let i = 0; i < len; i++) {
    salt += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return salt;
};

/**
 * Encodes a server into a unique, shareable invite code.
 * @param {object} server
 * @param {boolean} fresh - whether to force a new unique code with fresh salt
 */
export const encodeServerToInvite = (server, fresh = false) => {
  if (!server) return 'VOXEL';
  if (server.id === 'server-1') return 'COMMUNITY';

  const raw = (server.id || '').replace(/^server-/, '');
  const num = parseInt(raw, 10);
  
  if (!isNaN(num) && num > 1000000000000) {
    const baseCode = num.toString(36).toUpperCase();
    const salt = generateSalt(2);
    return `${salt}${baseCode}`;
  }

  return `${generateSalt(2)}${raw.substring(0, 6).toUpperCase()}` || 'VOXEL';
};

/**
 * Decodes any invite code or URL back to the exact server ID.
 */
export const decodeInviteToId = (inviteInput) => {
  if (!inviteInput || typeof inviteInput !== 'string') return null;
  let cleaned = inviteInput.trim();

  // Extract code from URL if provided (e.g. https://voxel.gg/invite/CODE or voxel.gg/invite/CODE)
  const match = cleaned.match(/invite\/([a-zA-Z0-9_-]+)/i);
  if (match) {
    cleaned = match[1];
  }

  cleaned = cleaned.replace(/^PC-?/i, '').replace(/[-_]/g, '').trim();

  // Direct server ID formats
  if (cleaned.startsWith('server-')) return cleaned;
  if (/^\d{12,}$/.test(cleaned)) return `server-${cleaned}`;
  if (cleaned.toLowerCase() === 'community' || cleaned === '1') return 'server-1';

  // 1. Try decoding full string directly as Base36 timestamp
  const directNum = parseInt(cleaned, 36);
  if (!isNaN(directNum) && directNum > 1000000000000 && directNum < 4000000000000) {
    return `server-${directNum}`;
  }

  // 2. Try stripping prefixes of length 1 to 4 (salt prefix)
  for (let saltLen = 1; saltLen <= 4; saltLen++) {
    if (cleaned.length > saltLen + 5) {
      const sub = cleaned.substring(saltLen);
      const subNum = parseInt(sub, 36);
      if (!isNaN(subNum) && subNum > 1000000000000 && subNum < 4000000000000) {
        return `server-${subNum}`;
      }
    }
  }

  // 3. Try stripping suffixes of length 1 to 4 (salt suffix)
  for (let saltLen = 1; saltLen <= 4; saltLen++) {
    if (cleaned.length > saltLen + 5) {
      const sub = cleaned.substring(0, cleaned.length - saltLen);
      const subNum = parseInt(sub, 36);
      if (!isNaN(subNum) && subNum > 1000000000000 && subNum < 4000000000000) {
        return `server-${subNum}`;
      }
    }
  }

  return cleaned;
};
