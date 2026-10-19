package api

import (
	"encoding/json"
	"net/http"
	"time"
	"uuid"
)

func (h *Handler) HandleUpload(w http.ResponseWriter, r *http.Request) {
	transferId := uuid.New().String()

	r.Body = http.MaxBytesReader(w, r.Body, 10<<20)
	if err := h.storage.StoreFile(r.Context(), transferId, r.Body); err != nil {
		http.Error(w, "failed to upload file", http.StatusInternalServerError)
		return
	}
	err := h.cache.Set(r.Context(), transferId, "active", 10*time.Minute)
	if err != nil {
		h.storage.DeleteFile(r.Context(), transferId)
		http.Error(w, "failed to save session", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{"id": transferId})
}
