package api

import (
	"io"
	"log"
	"net/http"
	"strconv"
)

func (h *Handler) HandleDownload(w http.ResponseWriter, r *http.Request) {
	transferId := r.PathValue("id")
	var session any
	if err := h.cache.Get(r.Context(), transferId, session); err != nil {
		http.Error(w, "failed to get session data", http.StatusInternalServerError)
		return
	}
	file, err := h.storage.GetFile(r.Context(), transferId)
	if err != nil {
		http.Error(w, "failed to get file object", http.StatusInternalServerError)
		return
	}
	defer file.Body.Close()

	w.Header().Set("Content-Type", "application/octet-stream")
	if file.ContentLength != nil {
		w.Header().Set("Content-Length", strconv.FormatInt(*file.ContentLength, 10))
	}
	w.Header().Set("Content-Disposition", `attachment; filename="ciphertext.bin"`)

	if _, err := io.Copy(w, file.Body); err != nil {
		// too late for http.Error, so we just log it instead
		log.Printf("streaming error %s: %v", transferId, err)
	}
}
