import { unpackEnvelope } from "./envelope";
import { IV_LENGTH, TAG_LENGTH } from "./format";

export async function decryptFile(
  key: CryptoKey,
  payload: ArrayBuffer,
): Promise<{ name: string; type: string; blob: Blob }> {
  if (payload.byteLength < IV_LENGTH + TAG_LENGTH) {
    throw new Error("payload is too short");
  }

  const iv = new Uint8Array(payload, 0, IV_LENGTH);
  const ciphertext = new Uint8Array(payload, IV_LENGTH);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext,
    );
  } catch {
    // GCM fails the tag check for any wrong key or corrupted byte, and that is
    // indistinguishable from a truncated body here.
    throw new Error("wrong key, or the file is corrupted");
  }

  const { name, type, data } = unpackEnvelope(plaintext);
  return { name, type, blob: new Blob([data], { type }) };
}
