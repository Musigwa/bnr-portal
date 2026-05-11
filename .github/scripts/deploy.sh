#!/bin/bash
set -e

SERVICE=$1
TAG=$2
APP_NAME=${3:-bnr-portal}

# Force APP_NAME to be lowercase and replace underscores with hyphens for valid domains
APP_NAME=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr '_' '-')

export APP_NAME=$APP_NAME

if [ -z "$SERVICE" ] || [ -z "$TAG" ]; then
  echo "Usage: $0 <service_name> <image_tag> [app_name]"
  exit 1
fi

echo "🚀 Deploying $SERVICE with tag $TAG..."

export IMAGE_TAG=$TAG
export GITHUB_REPOSITORY_OWNER=${GITHUB_REPOSITORY_OWNER:-musigwa}

ENV_FILE=""
if [ -f ".env.production" ]; then
  ENV_FILE="--env-file .env.production"
  echo "ℹ️ Using .env.production file"
fi

# 0. Ensure database is running (only for backend)
if [ "$SERVICE" = "backend" ]; then
  echo "🐘 Ensuring database is running..."
  docker compose -f docker.compose.yml $ENV_FILE --profile production up -d postgres
fi

# 1. Pull the new image
docker compose -f docker.compose.yml $ENV_FILE --profile production pull $SERVICE

# 1.1 Run migrations (only for backend)
if [ "$SERVICE" = "backend" ]; then
  echo "🔄 Running database migrations..."
  # Run a one-off container to apply migrations before starting the new app instances
  docker compose -f docker.compose.yml $ENV_FILE --profile production run --rm $SERVICE npm run migration:deploy
  echo "✅ Migrations completed successfully!"
fi

# 2. Find the ID of the currently running container (Old)
OLD_CONTAINER=$(docker ps --filter "label=com.docker.compose.service=$SERVICE" --filter "status=running" -q | head -n 1)

# 3. Scale up to 2 instances (starts the new one without stopping the old one)
docker compose -f docker.compose.yml $ENV_FILE --profile production up -d --no-deps --scale $SERVICE=2 $SERVICE

# 4. Find the NEW container (the one that is NOT the old one)
ALL_CONTAINERS=$(docker ps --filter "label=com.docker.compose.service=$SERVICE" --filter "status=running" -q)
NEW_CONTAINER=""
for c in $ALL_CONTAINERS; do
  if [ "$c" != "$OLD_CONTAINER" ]; then
    NEW_CONTAINER=$c
    break
  fi
done

if [ -z "$NEW_CONTAINER" ]; then
  echo "❌ Failed to find the new container!"
  exit 1
fi

NEW_CONTAINER_NAME=$(docker ps --filter "id=$NEW_CONTAINER" --format '{{.Names}}')
echo "🏷️ New container name: $NEW_CONTAINER_NAME"

# 5. Get the port assigned to the new container
# We assume the container exposes port 3000 for frontend and 3001 for backend internally
CONTAINER_PORT=3000
if [ "$SERVICE" = "backend" ]; then
  CONTAINER_PORT=3001
fi

NEW_PORT=$(docker port $NEW_CONTAINER $CONTAINER_PORT | cut -d: -f2)

if [ -z "$NEW_PORT" ]; then
  echo "❌ Failed to get port for new container!"
  exit 1
fi

echo "✅ New container $NEW_CONTAINER is running on port $NEW_PORT"

echo "🔍 Waiting for new container to become healthy..."
for i in {1..30}; do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' $NEW_CONTAINER)
  if [ "$STATUS" = "healthy" ]; then
    echo "✅ Container is healthy!"
    break
  fi
  echo "⏳ Current status: $STATUS. Waiting..."
  sleep 3
  if [ $i -eq 30 ]; then
    echo "❌ Container failed health check!"
    exit 1
  fi
done

# 6. Update Caddy configuration
CADDY_SITES_PATH="/opt/observability/caddy/sites"
UPSTREAM="$NEW_CONTAINER_NAME:$CONTAINER_PORT"
IS_HOST_CADDY=false

# Find Caddy container name
CADDY_CONTAINER=$(docker ps --format '{{.Names}}' | grep "caddy" | head -n 1)

# Detect if Caddy is running natively on the host
if [ -z "$CADDY_CONTAINER" ] && systemctl is-active --quiet caddy; then
  echo "ℹ️ Caddy is running natively on the host VPS. Using host Caddy routing..."
  CADDY_SITES_PATH="/etc/caddy/sites"
  UPSTREAM="127.0.0.1:$NEW_PORT"
  IS_HOST_CADDY=true
fi

# Define site config file path
SITE_FILE="${CADDY_SITES_PATH}/${SERVICE}.bnr-portal.caddy"

# Default to nip.io if not provided by environment
DOMAIN_ROOT=${DOMAIN_ROOT:-212.47.77.2.nip.io}
DOMAIN="${APP_NAME}.${DOMAIN_ROOT}"
if [ "$SERVICE" = "backend" ]; then
  DOMAIN="api.${APP_NAME}.${DOMAIN_ROOT}"
fi

TLS_LINE=""

# Write to a temp file first
cat <<EOF > /tmp/caddy_temp
$DOMAIN {
$TLS_LINE
    reverse_proxy $UPSTREAM
}
EOF

# Reload Caddy config based on whether it is native or dockerized
if [ "$IS_HOST_CADDY" = true ]; then
  echo "🔑 Gaining temporary write access to $CADDY_SITES_PATH using passwordless sudo chown..."
  sudo /bin/chown -R deploy:deploy "$CADDY_SITES_PATH"
  mv /tmp/caddy_temp "$SITE_FILE"
  echo "🔄 Reloading native host Caddy..."
  caddy reload --config /etc/caddy/Caddyfile
  
  echo "🔍 Verifying public routing through native Caddy..."
  PUBLIC_URL="https://${DOMAIN}/docs"
  if [ "$SERVICE" = "frontend" ]; then
    PUBLIC_URL="https://${DOMAIN}/"
  fi

  for i in {1..5}; do
    status=$(curl -s -k -o /dev/null -L -w "%{http_code}" -m 10 "$PUBLIC_URL" || echo "000")
    if [ "$status" = "200" ]; then
      echo "✅ Public routing is working! (Status: $status)"
      break
    fi
    echo "⏳ Waiting for native Caddy to route traffic (Current Status: $status)..."
    sleep 3
    if [ $i -eq 5 ]; then
      echo "❌ Public routing failed! Native Caddy might not be routing correctly."
      exit 1
    fi
  done
else
  if [ -z "$CADDY_CONTAINER" ]; then
    echo "⚠️ Caddy container not found! Skipping Caddy reload."
  else
    if [ -w "$CADDY_SITES_PATH" ]; then
      mv /tmp/caddy_temp "$SITE_FILE"
      echo "🔄 Reloading Caddy container..."
      docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
      
      echo "🔍 Verifying public routing through Caddy container..."
      PUBLIC_URL="https://${DOMAIN}/docs"
      if [ "$SERVICE" = "frontend" ]; then
        PUBLIC_URL="https://${DOMAIN}/"
      fi

      for i in {1..5}; do
        status=$(curl -s -k -o /dev/null -L -w "%{http_code}" -m 10 "$PUBLIC_URL" || echo "000")
        if [ "$status" = "200" ]; then
          echo "✅ Public routing is working! (Status: $status)"
          break
        fi
        echo "⏳ Waiting for Caddy container to route traffic (Current Status: $status)..."
        sleep 3
        if [ $i -eq 5 ]; then
          echo "❌ Public routing failed! Caddy container might not be routing correctly."
          exit 1
        fi
      done
    else
      echo "⚠️ Cannot write to $CADDY_SITES_PATH. Manual intervention may be required."
    fi
  fi
fi

# 7. Stop and remove the old container
if [ -n "$OLD_CONTAINER" ]; then
  echo "🛑 Stopping old container $OLD_CONTAINER..."
  docker stop $OLD_CONTAINER || true
  docker rm $OLD_CONTAINER || true
fi

echo "🎉 Deployment of $SERVICE complete!"
