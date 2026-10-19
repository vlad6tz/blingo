# blingo

A web platform for end-to-end encrypted file sharing. Files and their metadata
are encrypted on the client before they ever reach the server, so the storage
backend only ever holds ciphertext.

> **Note:** this is a learning project. It exists to explore client-side
> encryption, key handling, and object storage, not to be used with files you
> can't afford to lose. It has not been audited.

## Status

Early work in progress. Current pieces:

- Go backend (`cmd`, `internal/...`)
- `internal/api` — HTTP handlers (upload, download)
- `internal/crypt` —  package stub, not implemented yet
- `internal/storage` — S3-compatible (AWS S3 / Cloudflare R2) client
- `internal/cache` — Redis client and helpers

### Known limitations

- The server still sees the ciphertext size (the file size plus a small header,
  IV, and auth tag), the upload time, the object count, and the transfer id.
- Download links expire after 10 minutes. A link stops working a minute after
  its first successful download, though that window exists so a client that
  failed to decrypt can retry.

## Stack

- Go
- AWS SDK v2 (S3 / R2)
- go-redis (dragonfly)

## License

See [LICENSE](LICENSE).
