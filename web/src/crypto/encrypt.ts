import { packEnvelope } from "./envelope";
import { IV_LENGTH } from "./format";

// Returns `iv || AES-GCM(envelope)`, ready to be uploaded as opaque bytes.
export async function encryptFile(key: CryptoKey, file: File): Promise<Blob> {
  const envelope = packEnvelope(
    file.name,
    file.type,
    await file.arrayBuffer(),
  );
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    envelope,
  );
  return new Blob([iv, ciphertext]);
}
