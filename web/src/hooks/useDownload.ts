import { useEffect, useState } from "react";
import { ApiError, describeError, fetchCiphertext } from "@/lib/api";
import { decryptFile } from "@/crypto/decrypt";
import { importKey } from "@/crypto/key";
import { cryptoAvailable } from "@/lib/browser";
import { parseShareLink } from "@/lib/link";

export type DownloadPhase = "loading" | "ready" | "invalid" | "expired" | "error";

export interface ReadyFile {
  name: string;
  type: string;
  blob: Blob;
  size: number;
}

export function useDownload(id: string | undefined) {
  const [phase, setPhase] = useState<DownloadPhase>("loading");
  const [file, setFile] = useState<ReadyFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stale = false;
    setError(null);
    setFile(null);
    setPhase("loading");

    async function run() {
      // The key rides in the URL fragment, so the whole href is the input.
      const parsed = parseShareLink(window.location.href);
      if (!id || !parsed) {
        setPhase("invalid");
        return;
      }
      if (!cryptoAvailable()) {
        setPhase("error");
        setError(
          "Open this link over https (or on localhost); the browser blocks secure pages otherwise.",
        );
        return;
      }
      try {
        const payload = await fetchCiphertext(id);
        const key = await importKey(parsed.key);
        const { name, type, blob } = await decryptFile(key, payload);
        if (stale) return;
        setFile({ name, type, blob, size: blob.size });
        setPhase("ready");
      } catch (err) {
        if (stale) return;
        if (err instanceof ApiError && err.status === 404) {
          setPhase("expired");
          return;
        }
        setError(describeError(err));
        setPhase("error");
      }
    }
    run();
    return () => {
      stale = true;
    };
  }, [id]);

  return { phase, file, error };
}
