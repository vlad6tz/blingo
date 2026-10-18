package storage

import (
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Service struct {
	s3     *s3.Client
	bucket string
}

func NewService(cli *s3.Client, bucket string) *Service {
	return &Service{
		s3:     cli,
		bucket: bucket,
	}
}
func (s *Service) StoreFile(ctx context.Context, key string, body io.Reader) error {
	_, err := s.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
		Body:   body,
	})
	return err
}

func (s *Service) GetFile(ctx context.Context, key string) (*s3.GetObjectOutput, error) {
	obj, err := s.s3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get object %s: %w", key, err)
	}
	return obj, nil
}
