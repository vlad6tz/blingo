<p align="center">
  <img src="web/public/favicon.svg" width="140" alt="blingo logo">
</p>

# blingo

A web platform for end-to-end encrypted file sharing. Files and their metadata
are encrypted on the client before they ever reach the server, so the storage
backend only ever holds ciphertext.

> **Note:** this is a learning project. It exists to explore client-side
> encryption, key handling, and object storage, not to be used with files you
> can't afford to lose. It has not been audited.

## How it works

1. You pick a file in the browser; a fresh random AES-256-GCM key is generated
   client-side and the file is encrypted along with its name and MIME type
   (they live inside the encrypted envelope, so the server never sees them).
2. The ciphertext is uploaded; the server stores the opaque blob in an
   S3-compatible bucket (Cloudflare R2) and hands back a download id.
3. The page shows a one-time link of the form `/d/{id}#key`. The decryption
   key lives in the URL **fragment**, which is never sent to the server.
4. Whoever opens the link decrypts the file entirely in their browser.

Links expire 10 minutes after upload. After the first successful download a
link stops working, except for a one-minute grace window so a client that
failed to decrypt can retry.

Codes: uploads can also produce `123-456`-style six-digit share codes. The
digits wrap (encrypt) the file's key with a PBKDF2-derived key, so a recipient
simply types the code on the site instead of opening a link, and the server
still never sees any key material.

## Current state

Working end to end locally: upload, link sharing, download, expiry. Pieces:

- Go backend (`cmd`, `internal/...`)
- `internal/api`: HTTP handlers (upload, download, session TTLs)
- `internal/crypt`: envelope format helpers
- `internal/storage`: S3-compatible (AWS S3 / Cloudflare R2) client
- `internal/cache`: Redis client and helpers (Dragonfly)
- React 19 + TypeScript front end (Vite, Tailwind v4, shadcn), built with bun
- nginx reverse proxy in front of the API for production deployments
- `docker-compose.yaml` with `docker-compose.override.yaml` for local ports

Uploads are capped at 100 MB.

## Stack

- Go
- AWS SDK v2 (S3 / R2)
- go-redis (Dragonfly)
- React, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, bun

## Running it

Env vars (read from the environment or a `.env` file in the repo root):

- `AccountID`, `AccessKeyID`, `AccessKeySecret`, `BucketName`: Cloudflare R2
  (or any S3-compatible) credentials
- `RedisUrl` set for bare-metal runs; under docker compose it defaults to
  `redis://dragonfly:6379/0`

### With docker

```sh
docker compose up --build
```

The app is internal-only; nginx serves the front end and proxies `/api` to it.
`docker-compose.override.yaml` (gitignored) publishes local ports for dev.

### Bare metal

```sh
go run ./cmd                # API on :8080
cd web && bun install && bun run dev   # front end on :5173 with /api proxied
```

## FAQ

**Can the server see my file or its name?**
No. The name, MIME type, and content are all sealed inside the encrypted
envelope; the server only stores opaque ciphertext in the bucket.

**Where does the decryption key go?**
Into the URL fragment (`/d/{id}#key`). Browsers never send fragments to the
server, so the key stays in the link (and in the sender's and recipient's
browser history/tabs).

**What if I lose the link?**
The file is gone for good. The key isn't stored anywhere server-side, so
nothing can recover it.

**Why does a link stop working after the first download?**
Links are one-time by design. A one-minute grace window exists so a client
that received the bytes but failed to decrypt can retry; after that, the
session is closed and the object is deleted.

**What happens if nobody opens the link?**
It disappears 10 minutes after upload. The same applies to codes.

**Does the server learn anything at all?**
Yes. It sees the ciphertext size (file size plus a small envelope header, IV,
and auth tag), the upload time, and the session id. Approximate file size and
timing are the extent of what it can learn.

**Does it work offline or on plain HTTP?**
No. Encryption and decryption use `crypto.subtle`, which browsers only expose
in secure contexts (HTTPS or localhost).

**Can I send more than one file?**
Not yet. One link, one file.

**Who can read an unopened link?**
Anyone who has the full link. Treat it like a secret; it's a bearer token.

**How safe is a code compared to a link?**
The digits are the secret in that mode, and six digits are around 20 bits,
far weaker than the link's 256-bit key. Online guessing is held back by rate
limits (10 lookups per minute per address, plus a capped global rate), but a
ciphertext attacker with bucket access could brute-force the digits offline.
Rate limits key on `X-Forwarded-For` behind the proxy, which is best-effort
identity information. Use a code for convenience, use the link when it needs
to be tight.

**Is the crypto audited?**
No. It's AES-256-GCM via the browser's WebCrypto API, but the
implementation is unaudited learning code.

## License

See [LICENSE](LICENSE).
