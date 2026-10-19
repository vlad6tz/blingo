// The layout of an uploaded transfer is `iv || AES-GCM(envelope)`.
//
// Encrypt and decrypt must agree on this contract exactly, so the constants
// live here rather than in either of them.
export const IV_LENGTH = 12
export const TAG_LENGTH = 16
export const ENVELOPE_VERSION = 1
