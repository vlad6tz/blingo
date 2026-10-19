package api

import (
	"net/http"

	"github.com/vlad6tz/blingo.git/internal/cache"
	"github.com/vlad6tz/blingo.git/internal/storage"
)

type Handler struct {
	storage *storage.Service
	cache   *cache.Client
}

func NewHandler(s *storage.Service, r *cache.Client) *Handler {
	return &Handler{
		storage: s,
		cache:   r,
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/upload", h.HandleUpload)
	mux.HandleFunc("GET /api/download/{id}", h.HandleDownload)
}
