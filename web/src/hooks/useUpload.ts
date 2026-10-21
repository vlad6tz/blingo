import { useCallback, useState } from "react";
import { MAX_UPLOAD_BYTES, describeError, uploadFile } from "@/lib/api";
import { encryptFile } from "@/crypto/encrypt";
import { exportKey, generateKey } from "@/crypto/key";
import { buildShareLink } from "@/lib/link";

export type UploadPhase = "idle" | "encrypting" | "uploading" | "done";

export interface UploadResult {
  link: string;
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
      setError("The file is too large (max 10 MB).");
      return;
    }

    try {
      setPhase("encrypting");
      const key = await generateKey();
      const ciphertext = await encryptFile(key, file);
      const keyB64 = await exportKey(key);

      setPhase("uploading");
      const { id } = await uploadFile(ciphertext, setProgress);

      setResult({ link: buildShareLink(id, keyB64), name: file.name, size: file.size });
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
