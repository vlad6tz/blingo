import { ENVELOPE_VERSION } from "./format";

// The envelope is the plaintext that gets encrypted. It carries the metadata
// so the server never sees it:
//
//   off  size        field
//   0    1           version
//   1    2           nameLen, uint16 big-endian
//   3    nameLen     filename, UTF-8
//   ...  2           typeLen, uint16 big-endian
//   ...  typeLen     content type, UTF-8
//   ...  rest        file bytes

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value);
}

export function packEnvelope(
  name: string,
  type: string,
  data: ArrayBuffer,
): Uint8Array<ArrayBuffer> {
  const nameBytes = encoder.encode(name);
  const typeBytes = encoder.encode(type);
  if (nameBytes.length > 0xffff || typeBytes.length > 0xffff) {
    throw new Error("filename or content type is too long");
  }

  const headLength = 1 + 2 + nameBytes.length + 2 + typeBytes.length;
  const out = new Uint8Array(headLength + data.byteLength);
  const view = new DataView(out.buffer);

  let offset = 0;
  view.setUint8(offset, ENVELOPE_VERSION);
  offset += 1;
  writeUint16(view, offset, nameBytes.length);
  offset += 2;
  out.set(nameBytes, offset);
  offset += nameBytes.length;
  writeUint16(view, offset, typeBytes.length);
  offset += 2;
  out.set(typeBytes, offset);
  offset += typeBytes.length;
  out.set(new Uint8Array(data), offset);

  return out;
}

export function unpackEnvelope(buf: ArrayBuffer): {
  name: string;
  type: string;
  data: ArrayBuffer;
} {
  if (buf.byteLength < 5) {
    throw new Error("envelope is too short");
  }
  const view = new DataView(buf);
  if (view.getUint8(0) !== ENVELOPE_VERSION) {
    throw new Error("unsupported envelope version");
  }

  let offset = 1;
  const nameLength = view.getUint16(offset);
  offset += 2;
  if (offset + nameLength + 2 > buf.byteLength) {
    throw new Error("envelope is truncated");
  }
  const name = decoder.decode(new Uint8Array(buf, offset, nameLength));
  offset += nameLength;

  const typeLength = view.getUint16(offset);
  offset += 2;
  if (offset + typeLength > buf.byteLength) {
    throw new Error("envelope is truncated");
  }
  const type = decoder.decode(new Uint8Array(buf, offset, typeLength));
  offset += typeLength;

  return { name, type, data: buf.slice(offset) };
}
