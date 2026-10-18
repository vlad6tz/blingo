package cache

import (
	"context"
	"encoding/json/v2"
	"fmt"
	"time"
)

func (c *Client) Set(ctx context.Context, key string, value any, ttl time.Duration) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal %q: %w", key, err)
	}
	return c.rdb.Set(ctx, key, raw, ttl).Err()
}
func (c *Client) Del(ctx context.Context, key ...string) error {
	return c.rdb.Del(ctx, key...).Err()
}
