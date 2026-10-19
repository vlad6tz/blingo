import type { UploadResponse } from "../types/type";

const API = import.meta.env.VITE_API_URL ?? "/api";

// The body is opaque ciphertext, so the request carries no metadata: the
// filename and content type travel inside the encrypted envelope.
export async function uploadFile(ciphertext: Blob): Promise<UploadResponse> {
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    body: ciphertext,
  });
  if (!res.ok)
    throw new Error(`upload failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as UploadResponse;
}

export async function fetchCiphertext(id: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/download/${encodeURIComponent(id)}`);
  if (!res.ok)
    throw new Error(`download failed: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}
