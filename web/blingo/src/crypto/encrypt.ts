import { IV_LENGTH } from "./format";

export async function encryptFile(key: CryptoKey, file: File): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    await file.arrayBuffer(),
  );
  return new Blob([iv, ciphertext])
}
