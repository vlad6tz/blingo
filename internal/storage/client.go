package storage

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func GetBucketName() string {
	return os.Getenv("BucketName")
}

func Client(ctx context.Context) (*s3.Client, error) {
	accountID := os.Getenv("AccountID")
	accessKeyID := os.Getenv("AccessKeyID")
	accessKeySecret := os.Getenv("AccessKeySecret")
	if accountID == "" || accessKeyID == "" || accessKeySecret == "" {
		return nil, errors.New("env vars missing")
	}

	cfg, err := config.LoadDefaultConfig(
		ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, accessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, err
	}
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
		o.UsePathStyle = true
	})
	return client, nil
}
