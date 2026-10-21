// The code flow seals the link key with a wrapping key derived from the six
// digits, so a recipient can re-derive it from a code they typed instead of a
// URL fragment. The layout of a code blob is
//
//   pbkdf2 salt (16) || iv (12) || AES-GCM(raw key (32))
//
// derived from PBKDF2-SHA-256 over the digits, matching the server contract
// that the blob stays opaque ciphertext.
import { IV_LENGTH, TAG_LENGTH } from "./format";

export const CODE_LENGTH = 6;
export const CODE_PATTERN = /^[0-9]{6}$/;

const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 150_000;

// Thrown when unwrapping could not happen with these digits; the receiving
// flow renders it as a human "wrong code" message rather than a crypto error.
export class WrongCodeError extends Error {}

export function generateCode(): string {
  // Rejection-sampled uniform digits with no modulo bias.
  const view = new DataView(new ArrayBuffer(4));
  let out = "";
  while (out.length < CODE_LENGTH) {
    const [v] = crypto.getRandomValues(new Uint32Array(1));
    view.setUint32(0, v);
    const n = view.getUint32(0);
    if (n >= Math.floor(0x100000000 / 10) * 10) continue;
    out = out + String(n % 10);
  }
  return out;
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

async function deriveWrappingKey(
  code: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(code),
      "PBKDF2",
      false,
      ["deriveBits"],
    ),
    256,
  );
  return crypto.subtle.importKey("raw", bits, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// Seals the raw (base64url) link key with the digits and returns the blob to
// upload as the transfer's code link.
export async function wrapRawKey(
  raw: Uint8Array<ArrayBuffer>,
  code: string,
): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const wrapKey = await deriveWrappingKey(code, salt);
  const sealed = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, wrapKey, raw),
  );
  const out = new Uint8Array(SALT_LENGTH + IV_LENGTH + sealed.byteLength);
  out.set(salt, 0);
  out.set(iv, SALT_LENGTH);
  out.set(sealed, SALT_LENGTH + IV_LENGTH);
  return out;
}

// Re-derives the link key from a blob and the digits someone typed. Any wrong
// digit breaks the GCM tag check, so failure means "not this code" and is
// reported as a WrongCodeError.
export async function unwrapKey(
  blob: ArrayBuffer,
  code: string,
): Promise<CryptoKey> {
  if (blob.byteLength < SALT_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new WrongCodeError("code blob is too short");
  }
  const salt = new Uint8Array(blob, 0, SALT_LENGTH);
  const iv = new Uint8Array(blob, SALT_LENGTH, IV_LENGTH);
  const sealed = new Uint8Array(blob, SALT_LENGTH + IV_LENGTH);
  try {
    const wrapKey = await deriveWrappingKey(code, salt);
    const raw = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, wrapKey, sealed),
    );
    return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
      "decrypt",
    ]);
  } catch {
    throw new WrongCodeError("wrong code");
  }
}
