const crypto = require('crypto');

/**
 * Encrypt a buffer using AES-256-CBC
 * @param {Buffer} buffer - The plain file buffer to encrypt
 * @returns {Object} - Object containing encrypted Buffer and hex-encoded IV
 */
const encryptFile = (buffer) => {
  const keyHex = process.env.FILE_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('FILE_ENCRYPTION_KEY must be a 32-byte (64 hex characters) string in env variables');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16); // AES uses a 16-byte initialization vector

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
  };
};

/**
 * Decrypt a buffer using AES-256-CBC
 * @param {Buffer} encryptedBuffer - The encrypted file buffer
 * @param {string} ivHex - The hex-encoded Initialization Vector used during encryption
 * @returns {Buffer} - Decrypted plain file buffer
 */
const decryptFile = (encryptedBuffer, ivHex) => {
  const keyHex = process.env.FILE_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('FILE_ENCRYPTION_KEY must be a 32-byte (64 hex characters) string in env variables');
  }

  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  return decryptedBuffer;
};

module.exports = {
  encryptFile,
  decryptFile,
};
