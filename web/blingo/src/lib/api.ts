import type { UploadResponse } from "../types/type";

const API = import.meta.env.VITE_API_URL ?? "/api";

export async function uploadFile(
  ciphertext: Blob,
  filename: string,
  fileType: string,
): Promise<UploadResponse> {
  const res = await fetch(`${API}/upload`, {
    method: "POST",
    headers: {
      "X-Filename": encodeURIComponent(filename),
      "X-File-Type": fileType,
    },
    body: ciphertext,
  });
  if (!res.ok)
    throw new Error(`upload failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as UploadResponse;
}
export async function fetchCiphertext(id: string): Promise<Blob> {
  const res = await fetch(`${API}/download/${id}`, {
    method: "GET",
  });
  if (!res.ok)
    throw new Error(`download failed: ${res.status} ${await res.text()}`)
  return (await res.blob() as Blob)
}
