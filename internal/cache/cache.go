package cache

import (
	"context"
	"fmt"

	"github.com/redis/go-redis/v9"
)

type Client struct {
	rdb *redis.Client
}

func Connect(ctx context.Context, url string) (*Client, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("parse dragonfly url: %w", err)
	}
	c := &Client{rdb: redis.NewClient(opts)}
	if err := c.Ping(ctx); err != nil {
		_ = c.Close()
		return nil, fmt.Errorf("ping dragonfly: %w", err)
	}
	return c, nil
}

func (c *Client) Ping(ctx context.Context) error {
	return c.rdb.Ping(ctx).Err()
}

func (c *Client) Close() error {
	return c.rdb.Close()
}
