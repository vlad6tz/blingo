package api

import "time"

const (
	sessionTTL = 10 * time.Minute

	// downloadTTL bounds the window after the first successful stream in which
	// the same bytes can still be fetched again, so a client that failed to
	// decrypt can retry without the link staying usable for the full session.
	downloadTTL = time.Minute
)

// Session records where a transfer's ciphertext lives. The encrypted envelope
// carries the filename and content type, so the server keeps no metadata
// beyond the object key.
type Session struct {
	ObjectKey string    `json:"object_key"`
	CreatedAt time.Time `json:"created_at"`
}
