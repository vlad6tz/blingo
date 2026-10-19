package cache

import (
	"context"
	"encoding/json/v2"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var ErrNotFound = errors.New("key not found")

func (c *Client) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal %q: %w", key, err)
	}
	return c.rdb.Set(ctx, key, raw, ttl).Err()
}
func (c *Client) Get(ctx context.Context, key string, dest any) error {
	raw, err := c.rdb.Get(ctx, key).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return ErrNotFound
		}
		return err
	}
	return json.Unmarshal(raw, dest)
}

func (c *Client) Del(ctx context.Context, key ...string) error {
	return c.rdb.Del(ctx, key...).Err()
}

// Mark sets a short-lived sentinel, used to record that a transfer has been
// served without deleting its session outright.
func (c *Client) Mark(ctx context.Context, key string, ttl time.Duration) error {
	return c.rdb.Set(ctx, key, "1", ttl).Err()
}

// Marked reports whether a sentinel set by Mark is still present.
func (c *Client) Marked(ctx context.Context, key string) (bool, error) {
	n, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}
