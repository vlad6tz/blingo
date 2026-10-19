import { IV_LENGTH, TAG_LENGTH } from "./format";

export async function decryptFile(key: CryptoKey, payload: ArrayBuffer): Promise<Blob> {
  if (payload.byteLength < IV_LENGTH + TAG_LENGTH) {
    throw new Error("payload too short")
  }
  const iv = new Uint8Array(payload, 0, IV_LENGTH)
  const ciphertext = new Uint8Array(payload, IV_LENGTH)
  try {
    return new Blob([await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, ciphertext)])
  } catch {
    throw new Error('wrong key or corrupted file')
  }
}
