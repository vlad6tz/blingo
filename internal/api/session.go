package api

import "time"

type Session struct {
	ObjectKey string    `json:"object_key"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}
