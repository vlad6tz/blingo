package api

import (
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/vlad6tz/blingo.git/internal/cache"
	"github.com/vlad6tz/blingo.git/internal/storage"
)

func (h *Handler) HandleDownload(w http.ResponseWriter, r *http.Request) {
	transferId := r.PathValue("id")

	var session Session
	if err := h.cache.Get(r.Context(), transferId, &session); err != nil {
		if errors.Is(err, cache.ErrNotFound) {
			http.Error(w, "transfer not found", http.StatusNotFound)
			return
		}
		http.Error(w, "failed to get session data", http.StatusInternalServerError)
		return
	}

	markKey := "downloaded:" + transferId
	marked, err := h.cache.Marked(r.Context(), markKey)
	if err != nil {
		http.Error(w, "failed to get transfer state", http.StatusInternalServerError)
		return
	}

	file, err := h.storage.GetFile(r.Context(), session.ObjectKey)
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
		// too late for http.Error, so we just log it instead
		log.Printf("streaming error %s: %v", transferId, err)
		return
	}

	if marked {
		// Already inside the retry window; leaving the TTLs alone keeps a
		// repeated fetch from pushing the window back.
		return
	}
	if err := h.cache.Set(r.Context(), transferId, session, downloadTTL); err != nil {
		log.Printf("shorten session %s: %v", transferId, err)
	}
	if err := h.cache.Mark(r.Context(), markKey, downloadTTL); err != nil {
		log.Printf("mark downloaded %s: %v", transferId, err)
	}
}
