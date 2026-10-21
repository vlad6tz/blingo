package api

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/vlad6tz/blingo.git/internal/cache"
	"github.com/vlad6tz/blingo.git/internal/storage"
)

const (
	wrapKeyPrefix = "wrap:"
	codeKeyPrefix = "code:"
)

var codePattern = regexp.MustCompile(`^[0-9]{6}$`)

type codeLinkRequest struct {
	Id   string `json:"id"`
	Code string `json:"code"`
	Blob string `json:"blob"`
}

// HandleLink seals a transfer for sign-in by code: the client wraps the raw
// key with PBKDF2(digits, salt) and the server stores the opaque result plus a
// `code:<digits> -> id` reverse key. Nothing here learns anything new, the
// digits and the blob are client-generated.
func (h *Handler) HandleLink(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxCodeLinkBytes)
	var req codeLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			http.Error(w, "code link too large", http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	if !codePattern.MatchString(req.Code) {
		http.Error(w, "invalid code", http.StatusBadRequest)
		return
	}
	blob, err := base64.StdEncoding.DecodeString(req.Blob)
	if err != nil || len(blob) == 0 || len(blob) > maxCodeLinkBytes {
		http.Error(w, "invalid code blob", http.StatusBadRequest)
		return
	}

	var session Session
	if err := h.cache.Get(r.Context(), req.Id, &session); err != nil {
		if errors.Is(err, cache.ErrNotFound) {
			http.Error(w, "transfer not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to get session data", http.StatusInternalServerError)
		return
	}

	wrapKey := wrapKeyPrefix + req.Id
	if err := h.storage.StoreFile(r.Context(), wrapKey, bytes.NewReader(blob), int64(len(blob))); err != nil {
		http.Error(w, "failed to save code link", http.StatusInternalServerError)
		return
	}

	stored, err := h.cache.SetNX(r.Context(), codeKeyPrefix+req.Code, req.Id, sessionTTL)
	if err != nil {
		_ = h.storage.DeleteFile(r.Context(), wrapKey)
		http.Error(w, "failed to save code link", http.StatusInternalServerError)
		return
	}
	if !stored {
		// Another live transfer already owns these digits; the client is
		// expected to pick a fresh code and try again.
		_ = h.storage.DeleteFile(r.Context(), wrapKey)
		http.Error(w, "code already taken", http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// HandleLinkGet serves the stored wrap blob for a transfer id, exactly like
// HandleDownload would with the real ciphertext.
func (h *Handler) HandleLinkGet(w http.ResponseWriter, r *http.Request) {
	file, err := h.storage.GetFile(r.Context(), wrapKeyPrefix+r.PathValue("id"))
	if err != nil {
		if storage.IsNotFound(err) {
			http.Error(w, "file not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to get file object", http.StatusInternalServerError)
		return
	}
	defer file.Body.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	if file.ContentLength != nil && *file.ContentLength >= 0 {
		w.Header().Set("Content-Length", strconv.FormatInt(*file.ContentLength, 10))
	}
	if _, err := io.Copy(w, file.Body); err != nil {
		log.Printf("streaming code link error %s: %v", r.PathValue("id"), err)
	}
}

// HandleCode resolves six digits to the transfer id they claim. Both rate
// limits keep the digits space from being swept: one per requesting address,
// and one global that a forged X-Forwarded-For header cannot rotate around.
func (h *Handler) HandleCode(w http.ResponseWriter, r *http.Request) {
	digits := r.PathValue("digits")
	if !codePattern.MatchString(digits) {
		http.Error(w, "invalid code", http.StatusBadRequest)
		return
	}

	if n, err := h.cache.Bump(r.Context(), "code-ip:"+requestIP(r), codeRateWindow); err == nil && n > codeRateIP {
		http.Error(w, "too many code attempts", http.StatusTooManyRequests)
		return
	}
	if n, err := h.cache.Bump(r.Context(), "code-total", codeRateWindow); err == nil && n > codeRateGlobal {
		http.Error(w, "too many code attempts", http.StatusTooManyRequests)
		return
	}

	var id string
	if err := h.cache.Get(r.Context(), codeKeyPrefix+digits, &id); err != nil {
		if errors.Is(err, cache.ErrNotFound) {
			http.Error(w, "unknown code", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to resolve code", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"id": id})
}

// requestIP returns the requesting address, trusting the first hop of
// X-Forwarded-For only when it parses as an address; anything else falls back
// to the socket address. Behind the reverse proxy the header is what we have,
// which the README notes as a known limitation.
func requestIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		first := strings.TrimSpace(strings.Split(xff, ",")[0])
		if first != "" && net.ParseIP(first) != nil {
			return first
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
