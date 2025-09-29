#!/bin/bash

# Usage: ./link-env.sh [dev|prod]

if [ -z "$1" ]; then
    echo "Usage: ./link-env.sh [dev|prod]"
    exit 1
fi

ENV=$(echo "$1" | tr '[:upper:]' '[:lower:]')

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "Error: Use 'dev' or 'prod'"
    exit 1
fi

ln -sf .env.$ENV .env
echo ".env -> .env.$ENV"