import { useCallback, useEffect, useState } from "react";
import { ApiError, describeError, fetchCiphertext, fetchCodeLink, resolveCode } from "@/lib/api";
import { decryptFile } from "@/crypto/decrypt";
import { importKey } from "@/crypto/key";
import { WrongCodeError, unwrapKey } from "@/crypto/code";
import { cryptoAvailable } from "@/lib/browser";
import { parseShareLink } from "@/lib/link";

export type DownloadPhase = "code" | "loading" | "ready" | "invalid" | "expired" | "error";
export type DownloadMode = "link" | "code";

export interface ReadyFile {
  name: string;
  type: string;
  blob: Blob;
  size: number;
}

const WRONG_CODE_MESSAGE =
  "That code didn't work. Double-check the digits with the sender.";

export function useDownload(id: string | undefined) {
  const [mode, setMode] = useState<DownloadMode>(id ? "link" : "code");
  const [phase, setPhase] = useState<DownloadPhase>(id ? "loading" : "code");
  const [file, setFile] = useState<ReadyFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setMode("link");
    setPhase("loading");
    let stale = false;
    setError(null);
    setFile(null);

    async function run() {
      // The key rides in the URL fragment, so the whole href is the input.
      const parsed = parseShareLink(window.location.href);
      if (!parsed) {
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
        const payload = await fetchCiphertext(id!);
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

  const submitCode = useCallback(async (raw: string) => {
    const code = raw.replace(/\D/g, "");
    setMode("code");
    setError(null);
    setFile(null);
    setPhase("loading");

    if (!cryptoAvailable()) {
      setPhase("error");
      setError(
        "Open this page over https (or on localhost); the browser blocks secure pages otherwise.",
      );
      return;
    }
    try {
      const transferId = await resolveCode(code);
      const wrapBlob = await fetchCodeLink(transferId);
      const key = await unwrapKey(wrapBlob, code);
      const payload = await fetchCiphertext(transferId);
      const { name, type, blob } = await decryptFile(key, payload);
      setFile({ name, type, blob, size: blob.size });
      setPhase("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setPhase("expired");
        return;
      }
      if (err instanceof WrongCodeError) {
        setError(WRONG_CODE_MESSAGE);
        setPhase("error");
        return;
      }
      setError(describeError(err));
      setPhase("error");
    }
  }, []);

  return { mode, phase, file, error, submitCode };
}
