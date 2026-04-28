import { createCipheriv, randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

// We test the encryption logic directly without NestJS DI
// by extracting the core encrypt/decrypt logic

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function createEncryptionHelper(hexKey: string) {
  const key = Buffer.from(hexKey, "hex");

  return {
    encrypt(plaintext: string): string {
      const iv = randomBytes(IV_LENGTH);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      const authTag = cipher.getAuthTag();
      return Buffer.concat([iv, encrypted, authTag]).toString("base64");
    },
    decrypt(ciphertext: string): string {
      const combined = Buffer.from(ciphertext, "base64");
      if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
        throw new Error("Invalid ciphertext: too short");
      }
      const iv = combined.subarray(0, IV_LENGTH);
      const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
      const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

      const { createDecipheriv } = require("node:crypto");
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString("utf8");
    },
  };
}

const VALID_KEY = "a".repeat(64); // 32 bytes of 0xaa

describe("EncryptionService", () => {
  it("round-trips encrypt and decrypt", () => {
    const helper = createEncryptionHelper(VALID_KEY);
    const plaintext = "super-secret-oauth-token-12345";

    const encrypted = helper.encrypt(plaintext);
    const decrypted = helper.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
    expect(encrypted).not.toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const helper = createEncryptionHelper(VALID_KEY);
    const plaintext = "same-input";

    const encrypted1 = helper.encrypt(plaintext);
    const encrypted2 = helper.encrypt(plaintext);

    expect(encrypted1).not.toBe(encrypted2);
    expect(helper.decrypt(encrypted1)).toBe(plaintext);
    expect(helper.decrypt(encrypted2)).toBe(plaintext);
  });

  it("throws on tampered ciphertext", () => {
    const helper = createEncryptionHelper(VALID_KEY);
    const encrypted = helper.encrypt("sensitive-data");

    // Tamper with the ciphertext
    const buf = Buffer.from(encrypted, "base64");
    buf.writeUInt8(buf.readUInt8(IV_LENGTH + 1) ^ 0xff, IV_LENGTH + 1);
    const tampered = buf.toString("base64");

    expect(() => helper.decrypt(tampered)).toThrow();
  });

  it("throws on ciphertext that is too short", () => {
    const helper = createEncryptionHelper(VALID_KEY);
    const tooShort = Buffer.from("short").toString("base64");

    expect(() => helper.decrypt(tooShort)).toThrow("Invalid ciphertext: too short");
  });

  it("fails to decrypt with a wrong-length key", () => {
    const goodHelper = createEncryptionHelper(VALID_KEY);
    const encrypted = goodHelper.encrypt("test");
    const badHelper = createEncryptionHelper("bb".repeat(16)); // 16 bytes, not 32
    expect(() => badHelper.decrypt(encrypted)).toThrow();
  });
});
