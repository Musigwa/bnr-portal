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

# 1. Pull the new image
docker compose -f docker.compose.yml $ENV_FILE --profile production pull $SERVICE

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

# 6. Update Caddy configuration
# We assume Caddy looks at files in /opt/observability/caddy/sites/
CADDY_SITES_PATH="/opt/observability/caddy/sites"
SITE_FILE="${CADDY_SITES_PATH}/${SERVICE}.bnr-portal.caddy"

# Find Caddy container name
CADDY_CONTAINER=$(docker ps --format '{{.Names}}' | grep "caddy" | head -n 1)

if [ -z "$CADDY_CONTAINER" ]; then
  echo "⚠️ Caddy container not found! Skipping Caddy reload."
else
  echo "📝 Updating Caddy config at $SITE_FILE..."
  
  # Create the caddy file with the new port
  # Note: This is a simple reverse proxy config. Adjust domain as needed.
  # Default to nip.io if not provided by environment
  DOMAIN_ROOT=${DOMAIN_ROOT:-212.47.77.2.nip.io}

  # Construct the domain based on the app name and domain root
  DOMAIN="${APP_NAME}.${DOMAIN_ROOT}"
  if [ "$SERVICE" = "backend" ]; then
    DOMAIN="api.${APP_NAME}.${DOMAIN_ROOT}"
  fi
  
  # Write to a temp file first
  cat <<EOF > /tmp/caddy_temp
$DOMAIN {
    reverse_proxy $NEW_CONTAINER:$CONTAINER_PORT
}
EOF

  # Move to the shared volume path
  # This assumes the script runs on the host and has access to $CADDY_SITES_PATH
  if [ -w "$CADDY_SITES_PATH" ]; then
    mv /tmp/caddy_temp "$SITE_FILE"
    echo "🔄 Reloading Caddy..."
    docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile
  else
    echo "⚠️ Cannot write to $CADDY_SITES_PATH. Manual intervention may be required."
  fi
fi

# 7. Stop and remove the old container
if [ -n "$OLD_CONTAINER" ]; then
  echo "🛑 Stopping old container $OLD_CONTAINER..."
  docker stop $OLD_CONTAINER || true
  docker rm $OLD_CONTAINER || true
fi

echo "🎉 Deployment of $SERVICE complete!"
