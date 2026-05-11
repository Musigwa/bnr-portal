#!/bin/bash
set -e

# ==============================================================================
# BLUE/GREEN DEPLOYMENT SCRIPT for bnr-portal
# ==============================================================================

# 0. Load utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/utils.sh" ]; then 
    source "${SCRIPT_DIR}/utils.sh"
else 
    log_info() { echo "[INFO] $1"; }; log_error() { echo "[ERROR] $1" >&2; }; 
fi

# Set up global error trap
trap 'handle_error $? $LINENO' ERR

SERVICE=$1
TAG=$2
APP_NAME=${3:-bnr-portal}

APP_NAME=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
export APP_NAME=$APP_NAME
export IMAGE_TAG=$TAG
export GITHUB_REPOSITORY_OWNER=${GITHUB_REPOSITORY_OWNER:-musigwa}

# Load environment explicitly if present
if [ -f ".env" ]; then
  set -a; source .env; set +a
fi

if [ -z "$SERVICE" ] || [ -z "$TAG" ]; then
  echo "Usage: $0 <service_name> <image_tag> [app_name]"
  exit 1
fi

# ==============================================================================
# PRE-FLIGHT CHECKS — fail fast with clear errors before touching anything
# ==============================================================================
echo "----------------------------------------------------------------"
echo "Running pre-flight checks..."

# 1. DOMAIN_ROOT must be set (add as a GHA secret: DOMAIN_ROOT=212.47.77.2.nip.io or your real domain)
if [ -z "${DOMAIN_ROOT:-}" ]; then
  log_error "DOMAIN_ROOT is not set. Add it as a GHA secret (e.g. DOMAIN_ROOT=212.47.77.2.nip.io)."
  exit 1
fi

# 2. Caddy container must be running
CADDY_CONTAINER=$(docker ps --format '{{.Names}}' | grep "caddy" | head -n 1 || true)
if [ -z "$CADDY_CONTAINER" ]; then
  log_error "Caddy container not found. Is the Observability stack running on this VPS?"
  log_error "Run: cd /opt/observability && docker compose up -d"
  exit 1
fi

# 3. Caddy sites path must exist and be writable
CADDY_SITES_PATH="/opt/observability/caddy/sites"
if [ ! -d "$CADDY_SITES_PATH" ]; then
  log_error "Caddy sites directory not found: $CADDY_SITES_PATH"
  log_error "Expected Observability stack deployed at /opt/observability. Check VPS setup."
  exit 1
fi
if [ ! -w "$CADDY_SITES_PATH" ]; then
  log_error "Caddy sites directory is not writable: $CADDY_SITES_PATH"
  log_error "Fix: sudo chown -R $USER:$USER $CADDY_SITES_PATH"
  exit 1
fi

# 4. Resolve domain now so it's available throughout the script
DOMAIN="${APP_NAME}.${DOMAIN_ROOT}"
if [ "$SERVICE" = "backend" ]; then
  DOMAIN="api.${APP_NAME}.${DOMAIN_ROOT}"
fi

SITE_FILE="${CADDY_SITES_PATH}/${SERVICE}.${APP_NAME}.caddy"
BACKUP_FILE="${SITE_FILE}.wise.bak"

log_info "Pre-flight passed:"
log_info "  Caddy container : $CADDY_CONTAINER"
log_info "  Caddy sites     : $CADDY_SITES_PATH"
log_info "  Site file       : $SITE_FILE"
log_info "  Domain          : $DOMAIN"

echo "Starting Blue/Green Deployment for $SERVICE ($APP_NAME)"

# 1. Ensure infrastructure is running
echo "----------------------------------------------------------------"
echo "Verifying Persistence Stack (DB, Minio)..."

NETWORK_NAME="${APP_NAME}-network"
if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK_NAME}$"; then
  echo "Creating shared network: $NETWORK_NAME"
  docker network create "$NETWORK_NAME"
fi

INFRA_PROJECT="${APP_NAME}-infra"
export CONTAINER_SUFFIX=""
docker compose -p "$INFRA_PROJECT" --profile infra up -d

# 1.1 Run migrations if backend
if [ "$SERVICE" = "backend" ]; then
  echo "Running database migrations..."
  if docker compose -p "$INFRA_PROJECT-migrator" --profile production run --rm backend npx prisma migrate deploy; then
      echo "Migrations successful"
  else
      echo "Migrations failed! Aborting."
      exit 1
  fi
fi

# 2. Identify Active Color via Running Containers
BLUE_CONTAINER="${APP_NAME}-${SERVICE}-blue"
GREEN_CONTAINER="${APP_NAME}-${SERVICE}-green"

if docker ps --format '{{.Names}}' | grep -q "^${BLUE_CONTAINER}$"; then
  CURRENT_COLOR="blue"
  TARGET_COLOR="green"
elif docker ps --format '{{.Names}}' | grep -q "^${GREEN_CONTAINER}$"; then
  CURRENT_COLOR="green"
  TARGET_COLOR="blue"
else
  # First run or recovery: Default to Blue
  echo "No active container found. Defaulting to Blue."
  CURRENT_COLOR="none"
  TARGET_COLOR="blue"
fi

echo "   Current: $CURRENT_COLOR"
echo "   Target:  $TARGET_COLOR"

# 3. Deploy Target
echo "----------------------------------------------------------------"
echo "Deploying $SERVICE to $TARGET_COLOR..."

PROJECT_NAME="${APP_NAME}-${SERVICE}-${TARGET_COLOR}"
export CONTAINER_SUFFIX="-${TARGET_COLOR}"
export DEPLOYMENT_COLOR="${TARGET_COLOR}"

docker compose -p "$PROJECT_NAME" --profile production up -d $SERVICE
register_rollback "docker compose -p \"$PROJECT_NAME\" stop $SERVICE"

# 3.1 Discover Assigned Port
TARGET_CONTAINER="${APP_NAME}-${SERVICE}-${TARGET_COLOR}"
echo "   Discovering assigned port for $TARGET_CONTAINER..."

# Discover internal port dynamically using env variables
if [ "$SERVICE" = "backend" ]; then
  INTERNAL_PORT=$BACKEND_PORT
  if [ -z "$INTERNAL_PORT" ]; then
    echo "Error: BACKEND_PORT is not defined in the environment or .env file"
    exit 1
  fi
else
  INTERNAL_PORT=$NEXT_FRONTEND_PORT
  if [ -z "$INTERNAL_PORT" ]; then
    echo "Error: NEXT_FRONTEND_PORT is not defined in the environment or .env file"
    exit 1
  fi
fi

TARGET_PORT=$(docker port "$TARGET_CONTAINER" $INTERNAL_PORT/tcp | head -n 1 | cut -d: -f2)

if [ -z "$TARGET_PORT" ]; then
    echo "Error: Could not discover assigned port for $TARGET_CONTAINER"
    exit 1
fi

echo "   Discovered Port: $TARGET_PORT"

# 4. Health Check
echo "----------------------------------------------------------------"
echo "Verifying Health..."
MAX_RETRIES=15
HEALTHY="false"
for i in $(seq 1 $MAX_RETRIES); do
  STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$TARGET_CONTAINER" 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "healthy" ]; then
    echo "Health Check Passed!"
    HEALTHY="true"
    break
  fi
  echo "   ...waiting for health ($i/$MAX_RETRIES). Current status: $STATUS"
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "Recent container logs for $TARGET_CONTAINER:"
    docker logs --tail 20 "$TARGET_CONTAINER"
  fi
  sleep 4
done

if [ "$HEALTHY" != "true" ]; then
  log_error "Health Check Failed!"
  exit 1
fi

# 5. Switch Traffic (Update Caddy)
# Note: CADDY_CONTAINER, CADDY_SITES_PATH, SITE_FILE, DOMAIN, BACKUP_FILE
# are all set and validated in the pre-flight block above.
echo "----------------------------------------------------------------"
echo "Switching Traffic to $TARGET_COLOR..."
log_info "Caddy: container='$CADDY_CONTAINER' site_file='$SITE_FILE' domain='$DOMAIN'"

# Step-wise switch with rollback registration
if [ -f "$SITE_FILE" ]; then
    log_info "Backing up current configuration..."
    cp "$SITE_FILE" "$BACKUP_FILE"
    register_rollback "mv \"$BACKUP_FILE\" \"$SITE_FILE\" && docker exec \"$CADDY_CONTAINER\" caddy reload --config /etc/caddy/Caddyfile"
fi

# Write new site config
cat <<EOF > "$SITE_FILE"
# $APP_NAME $SERVICE
$DOMAIN {
    import standard_headers
    reverse_proxy $TARGET_CONTAINER:$INTERNAL_PORT
EOF

# Allow Caddy to naturally provision Let's Encrypt/ZeroSSL certificates

echo "}" >> "$SITE_FILE"

# Ensure Caddy is connected to the app network so it can reach app containers
if ! docker inspect "$CADDY_CONTAINER" --format '{{json .NetworkSettings.Networks}}' | grep -q "$NETWORK_NAME"; then
    log_info "Bridging Caddy to app network: $NETWORK_NAME"
    docker network connect "$NETWORK_NAME" "$CADDY_CONTAINER" || true
fi

# Reload Caddy
log_info "Reloading Caddy..."
docker exec "$CADDY_CONTAINER" caddy reload --config /etc/caddy/Caddyfile 2>&1 | grep -v "level" | grep -v "ts" || true
echo "Traffic switched successfully"

# Verify Routing
echo "Verifying public routing..."
PUBLIC_URL="https://${DOMAIN}/docs"
if [ "$SERVICE" = "frontend" ]; then
  PUBLIC_URL="https://${DOMAIN}/"
fi

for i in {1..5}; do
  status=$(curl -s -k -o /dev/null -L -w "%{http_code}" -m 10 "$PUBLIC_URL" || echo "000")
  if [ "$status" = "200" ]; then
    echo "Public routing is working! (Status: $status)"
    break
  fi
  echo "Waiting for Caddy to route traffic (Current Status: $status)..."
  sleep 3
  if [ $i -eq 5 ]; then
    echo "Public routing verification failed! Continuing anyway, but you should check."
  fi
done

# 6. Contract (Cleanup Old)
if [ "$CURRENT_COLOR" != "none" ]; then
  echo ""
  echo "Cleaning up old deployment..."
  OLD_PROJECT_NAME="${APP_NAME}-${SERVICE}-${CURRENT_COLOR}"
  docker compose -p "$OLD_PROJECT_NAME" stop $SERVICE >/dev/null 2>&1
  docker compose -p "$OLD_PROJECT_NAME" rm -f $SERVICE >/dev/null 2>&1
  echo "Removed old $CURRENT_COLOR slot"
fi

# Clean up "Wise" backups on success
rm -f "${SITE_FILE}.wise.bak"

echo "DEPLOYMENT OF $SERVICE SUCCESSFUL"
