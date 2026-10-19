package api

import (
	"encoding/json"
	"errors"
	"mime"
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
	contentType := "application/octet-stream"
	if parsed, _, err := mime.ParseMediaType(r.Header.Get("X-File-Type")); err == nil && parsed != "" {
		contentType = parsed
	}

	session := Session{
		ObjectKey:   transferId,
		Filename:    sanitizeFilename(r.Header.Get("X-Filename")),
		ContentType: contentType,
		Size:        r.ContentLength,
		CreatedAt:   time.Now(),
	}
	err := h.cache.Set(r.Context(), transferId, session, 10*time.Minute)
	if err != nil {
		h.storage.DeleteFile(r.Context(), transferId)
		http.Error(w, "failed to save session", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":       transferId,
		"filename": session.Filename,
		"size":     session.Size,
	})
}
