package api

import "time"

const (
	sessionTTL = 10 * time.Minute

	// downloadTTL bounds the window after the first successful stream in which
	// the same bytes can still be fetched again, so a client that failed to
	// decrypt can retry without the link staying usable for the full session.
	downloadTTL = time.Minute
)

// Code-link constants. A code link wraps the transfer's raw key with a key
// derived from six digits, so the code alone is what recipients type; the
// digits resolve to the transfer id through a short-lived reverse key.
const (
	codeLength       = 6
	maxCodeLinkBytes = 1 << 12

	codeRateIP     = 10  // code lookups per ip, per window
	codeRateGlobal = 300 // code lookups in total, per window
	codeRateWindow = time.Minute
)

// Session records where a transfer's ciphertext lives. The encrypted envelope
// carries the filename and content type, so the server keeps no metadata
// beyond the object key. Sign-in via share code maps `code:<digits>` keys onto
// the session id; the wrap object itself is opaque ciphertext.
type Session struct {
	ObjectKey string    `json:"object_key"`
	CreatedAt time.Time `json:"created_at"`
}
