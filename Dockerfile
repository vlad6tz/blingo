# syntax=docker/dockerfile:1

FROM golang:1.27-alpine AS build
WORKDIR /src

RUN apk add --no-cache ca-certificates git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/blingo ./cmd

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
COPY --from=build /out/blingo /usr/local/bin/blingo
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["blingo"]
