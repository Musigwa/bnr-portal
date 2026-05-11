#!/bin/bash
# Generate Environment File from GitHub Secrets
#
# Required Environment Variables:
#   SECRETS_JSON - JSON string of all GitHub secrets
#   TARGET_ENV - Environment name (staging/production)

# Load utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/utils.sh"

# Validate required environment variables
require_commands jq
require_env SECRETS_JSON "JSON string of all secrets"
require_env TARGET_ENV "Target environment (e.g., staging, production)"

# Set output file
OUTPUT_FILE=".env.${TARGET_ENV}"

log_info "Generating environment file for '$TARGET_ENV' environment"

# Create temporary file for output
TEMP_OUTPUT=$(mktemp)
cleanup() {
    rm -f "$TEMP_OUTPUT"
}
trap cleanup EXIT

# Write header
cat > "$TEMP_OUTPUT" << 'EOF'
#
# Auto-generated .env file for deployment
# Generated from GitHub Secrets
#
# DO NOT EDIT MANUALLY - Changes will be overwritten on next deployment
#

EOF

# Parse all secrets from JSON and write to env file
# SMART QUOTING:
# - Numeric values: NO quotes (Docker Compose needs APP_PORT=4001, not APP_PORT="4001")
# - Boolean values: NO quotes (APP_DOCS_ENABLED=true, not APP_DOCS_ENABLED="true")
# - String values: Quoted (passwords with $ ! etc. need protection when sourced)
# NOTE: We EXCLUDE SSH_*, VPS_*, and GITHUB_* secrets - they're for workflow actions only
log_info "Parsing secrets from JSON..."
echo "$SECRETS_JSON" | jq -r '
  to_entries | .[] |
  select(.key | test("^(SSH_|VPS_|GITHUB_)") | not) |
  if (.value | test("^([0-9]+|true|false)$")) then
    "\(.key)=\(.value)"
  else
    "\(.key)=\"\(.value)\""
  end
' >> "$TEMP_OUTPUT"

# Mandatory App Info (Passed via Workflows)
if [ -n "${APP_NAME:-}" ]; then
  APP_NAME_LOWER=$(echo "$APP_NAME" | tr '[:upper:]' '[:lower:]')
  log_info "Setting APP_NAME=$APP_NAME_LOWER"
  echo "APP_NAME=\"$APP_NAME_LOWER\"" >> "$TEMP_OUTPUT"
fi

# Set NODE_ENV explicitly from TARGET_ENV
echo "NODE_ENV=\"${TARGET_ENV}\"" >> "$TEMP_OUTPUT"

# Enforce that all required environment variables are defined
log_info "Verifying required environment variables are configured..."
REQUIRED_VARS=(
  "BACKEND_PORT"
  "NEXT_FRONTEND_PORT"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "NEXT_PUBLIC_API_URL"
  "DB_USER"
  "DB_PASSWORD"
  "DB_NAME"
  "MINIO_ENDPOINT"
  "MINIO_PORT"
  "MINIO_ACCESS_KEY"
  "MINIO_SECRET_KEY"
  "MINIO_BUCKET_NAME"
)

failed=0
for var in "${REQUIRED_VARS[@]}"; do
  if ! grep -q "^${var}=" "$TEMP_OUTPUT"; then
    log_error "Required configuration variable '${var}' is missing! Please configure it in your environment/secrets."
    failed=1
  fi
done

if [ $failed -eq 1 ]; then
  exit 2
fi

# Atomic move to final location
mv "$TEMP_OUTPUT" "$OUTPUT_FILE"

log_info "Environment file generated successfully: $OUTPUT_FILE"
