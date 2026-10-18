package cache

import (
	"context"
	"encoding/json/v2"
	"errors"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

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
			return fmt.Errorf("cache key not found")
		}
		return err
	}
	return json.Unmarshal(raw, dest)
}

func (c *Client) Del(ctx context.Context, key ...string) error {
	return c.rdb.Del(ctx, key...).Err()
}
