package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/vlad6tz/blingo.git/internal/api"
	"github.com/vlad6tz/blingo.git/internal/cache"
	"github.com/vlad6tz/blingo.git/internal/storage"
)

const addr = ":8080"

func main() {
	ctx := context.Background()

	redisURL := os.Getenv("RedisUrl")
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}

	rdb, err := cache.Connect(ctx, redisURL)
	if err != nil {
		log.Fatalf("cache: %v", err)
	}
	defer rdb.Close()

	s3Client, err := storage.Client(ctx)
	if err != nil {
		log.Fatalf("storage: %v", err)
	}

	bucket := storage.GetBucketName()
	if bucket == "" {
		log.Fatal("storage: BucketName is not set")
	}

	mux := http.NewServeMux()
	api.NewHandler(storage.NewService(s3Client, bucket), rdb).RegisterRoutes(mux)

	srv := &http.Server{
		Addr:              addr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("listening on %s", addr)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
