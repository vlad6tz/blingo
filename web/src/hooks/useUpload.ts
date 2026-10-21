import { useCallback, useState } from "react";
import { MAX_UPLOAD_BYTES, ApiError, describeError, registerCodeLink, uploadFile } from "@/lib/api";
import { encryptFile } from "@/crypto/encrypt";
import { exportKey, fromBase64Url, generateKey } from "@/crypto/key";
import { formatCode, generateCode, wrapRawKey } from "@/crypto/code";
import { buildShareLink } from "@/lib/link";

export type UploadPhase = "idle" | "encrypting" | "uploading" | "done";

export interface UploadResult {
  link: string;
  code?: string;
  name: string;
  size: number;
}

export function useUpload() {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setProgress(0);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("The file is too large (max 100 MB).");
      return;
    }

    try {
      setPhase("encrypting");
      const key = await generateKey();
      const ciphertext = await encryptFile(key, file);
      const keyB64 = await exportKey(key);

      setPhase("uploading");
      const { id } = await uploadFile(ciphertext, setProgress);

      // A share code wraps the raw key with PBKDF2(digits); when the code
      // registration fails, the transfer still works as a plain link.
      let code: string | undefined;
      try {
        for (let attempt = 0; !code; attempt++) {
          const digits = generateCode();
          const blob = await wrapRawKey(fromBase64Url(keyB64), digits);
          try {
            await registerCodeLink(id, digits, blob);
            code = formatCode(digits);
          } catch (err) {
            if (!(err instanceof ApiError) || err.status !== 409 || attempt >= 4) {
              throw err;
            }
          }
        }
      } catch {
        code = undefined;
      }

      setResult({ link: buildShareLink(id, keyB64), code, name: file.name, size: file.size });
      setPhase("done");
    } catch (err) {
      setError(describeError(err));
      setPhase("idle");
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setResult(null);
    setError(null);
  }, []);

  return { phase, progress, result, error, start, reset };
}
