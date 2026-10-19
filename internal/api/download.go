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

	if err := h.cache.Del(r.Context(), transferId); err != nil {
		log.Printf("remove session %s : %v", transferId, err)
	}
}
