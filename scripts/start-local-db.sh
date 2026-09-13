#!/usr/bin/env bash
set -e

CONTAINER_NAME="recomenator-db"
POSTGRES_USER="recomenator"
POSTGRES_PASSWORD="recomenator"
POSTGRES_DB="recomenator"
PORT="5432"

if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
  echo "Container '$CONTAINER_NAME' already exists. Starting it..."
  docker start "$CONTAINER_NAME"
else
  echo "Creating new Postgres container '$CONTAINER_NAME'..."
  docker run --name "$CONTAINER_NAME" \
    -e POSTGRES_USER="$POSTGRES_USER" \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -e POSTGRES_DB="$POSTGRES_DB" \
    -p "$PORT":5432 \
    -d postgres:16
fi

echo ""
echo "Postgres is running on port $PORT"
echo "DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$PORT/$POSTGRES_DB"
echo "DATABASE_URL_UNPOOLED=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:$PORT/$POSTGRES_DB"
