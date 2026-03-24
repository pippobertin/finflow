import { gcm } from "@noble/ciphers/aes.js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function getKey(): Uint8Array {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes for AES-256)");
  }
  return Uint8Array.from(Buffer.from(ENCRYPTION_KEY, "hex"));
}

function randomBytes(length: number): Uint8Array {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  return buf;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const nonce = randomBytes(12);
  const aes = gcm(key, nonce);
  const data = new TextEncoder().encode(plaintext);
  const ciphertext = aes.encrypt(data);

  // Concatenate nonce + ciphertext and encode as base64
  const combined = new Uint8Array(nonce.length + ciphertext.length);
  combined.set(nonce);
  combined.set(ciphertext, nonce.length);

  return Buffer.from(combined).toString("base64");
}

export function decrypt(encrypted: string): string {
  const key = getKey();
  const combined = Uint8Array.from(Buffer.from(encrypted, "base64"));

  const nonce = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const aes = gcm(key, nonce);
  const decrypted = aes.decrypt(ciphertext);

  return new TextDecoder().decode(decrypted);
}
