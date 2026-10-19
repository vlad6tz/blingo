package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"
	"uuid"
)

const maxUploadBytes = 10 << 20

func (h *Handler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	if r.ContentLength < 0 {
		http.Error(w, "content-length required", http.StatusLengthRequired)
		return
	}
	if r.ContentLength > maxUploadBytes {
		http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
		return
	}

	transferId := uuid.New().String()

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if err := h.storage.StoreFile(r.Context(), transferId, r.Body, r.ContentLength); err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			http.Error(w, "payload too large", http.StatusRequestEntityTooLarge)
			return
		}
		http.Error(w, "failed to upload file", http.StatusInternalServerError)
		return
	}
	session := Session{
		ObjectKey: transferId,
		CreatedAt: time.Now(),
	}
	if err := h.cache.Set(r.Context(), transferId, session, sessionTTL); err != nil {
		h.storage.DeleteFile(r.Context(), transferId)
		http.Error(w, "failed to save session", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{"id": transferId})
}
