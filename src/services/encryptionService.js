// src/services/encryptionService.js
const crypto = require('crypto');
const key    = Buffer.from(process.env.FILE_ENCRYPTION_KEY, 'hex'); // 32‑byte key

function encrypt(text) {
  const iv    = crypto.randomBytes(12); // 96‑bit nonce for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag       = cipher.getAuthTag();
  // return base64 iv + tag + encrypted
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data) {
  const b       = Buffer.from(data, 'base64');
  const iv      = b.slice(0, 12);
  const tag     = b.slice(12, 28);
  const encrypted = b.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, null, 'utf8') + decipher.final('utf8');
}

module.exports = { encrypt, decrypt };
