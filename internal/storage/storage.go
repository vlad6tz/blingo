package storage

import (
	"context"
	"errors"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
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
func (s *Service) StoreFile(ctx context.Context, key string, body io.Reader, size int64) error {
	_, err := s.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(s.bucket),
		Key:           aws.String(key),
		Body:          body,
		ContentLength: aws.Int64(size),
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
func (s *Service) DeleteFile(ctx context.Context, key string) error {
	_, err := s.s3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object %s:%w", key, err)
	}
	return err
}
func IsNotFound(err error) bool {
	var noSuchKey *types.NoSuchKey
	return errors.As(err, &noSuchKey)
}
