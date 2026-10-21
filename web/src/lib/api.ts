import type { UploadResponse } from "../types/type";

const API = import.meta.env.VITE_API_URL ?? "/api";

// Mirrors maxUploadBytes on the server, so oversized files are rejected
// before any bytes leave the browser.
export const MAX_UPLOAD_BYTES = 100 << 20;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 0:
        return "Couldn't connect — check your internet and try again.";
      case 404:
        return "This link has expired or its file was already received. Ask for a new one.";
      case 413:
        return "The file is too large (max 100 MB).";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  if (err instanceof DOMException && err.name === "OperationError") {
    return "The file couldn't be opened — the link may be broken. Ask for a fresh one.";
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

// XHR rather than fetch so the caller gets upload progress; a Blob body
// sets Content-Length exactly the same way.
export function uploadFile(
  ciphertext: Blob,
  onProgress?: (pct: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResponse);
        } catch {
          reject(new ApiError(xhr.status, "Got an unexpected response — please try again."));
        }
      } else {
        reject(new ApiError(xhr.status, `Upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error."));
    xhr.send(ciphertext);
  });
}

export async function fetchCiphertext(id: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/download/${encodeURIComponent(id)}`);
  if (!res.ok) throw new ApiError(res.status, `Download failed (${res.status}).`);
  return res.arrayBuffer();
}
