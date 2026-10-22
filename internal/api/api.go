package api

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/vlad6tz/blingo.git/internal/cache"
	"github.com/vlad6tz/blingo.git/internal/storage"
)

type Handler struct {
	storage     *storage.Service
	cache       *cache.Client
	deleteQueue chan string
}

func NewHandler(s *storage.Service, r *cache.Client) *Handler {
	h := &Handler{
		storage:     s,
		cache:       r,
		deleteQueue: make(chan string, 256),
	}
	go h.deleteWorker()
	return h
}

func (h *Handler) deleteWorker() {
	for key := range h.deleteQueue {
		key := key

		go func() {
			time.Sleep(downloadTTL)

			if err := h.storage.DeleteFile(context.Background(), key); err != nil {
				log.Printf("worker delete file %s: %v", key, err)
			}
		}()
	}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/upload", h.HandleUpload)
	mux.HandleFunc("GET /api/download/{id}", h.HandleDownload)
	mux.HandleFunc("POST /api/link", h.HandleLink)
	mux.HandleFunc("GET /api/link/{id}", h.HandleLinkGet)
	mux.HandleFunc("GET /api/code/{digits}", h.HandleCode)
}
