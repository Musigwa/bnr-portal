#!/bin/bash
# Shared Utilities for GitHub Actions Scripts
# Source this file in other scripts: source "$(dirname "$0")/utils.sh"

set -euo pipefail  # Fail on: undefined vars, pipe errors, command failures

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        echo -e "${BLUE}[DEBUG]${NC} $*"
    fi
}

# Validate required environment variable
require_env() {
    local var_name="$1"
    local description="${2:-$var_name}"
    
    if [[ -z "${!var_name:-}" ]]; then
        log_error "Required environment variable not set: $var_name ($description)"
        exit 2
    fi
    log_debug "✓ $var_name is set"
}

# Validate multiple required environment variables
require_envs() {
    local failed=0
    for var_name in "$@"; do
        if [[ -z "${!var_name:-}" ]]; then
            log_error "Required environment variable not set: $var_name"
            failed=1
        fi
    done
    
    if [[ $failed -eq 1 ]]; then
        exit 2
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Ensure required commands are available
require_commands() {
    local failed=0
    for cmd in "$@"; do
        if ! command_exists "$cmd"; then
            log_error "Required command not found: $cmd"
            failed=1
        fi
    done
    
    if [[ $failed -eq 1 ]]; then
        exit 2
    fi
}

# Safe cleanup on exit
cleanup_on_exit() {
    local cleanup_func="$1"
    trap "$cleanup_func" EXIT INT TERM
}

# Measure execution time
timer_start() {
    TIMER_START=$(date +%s)
}

timer_end() {
    local end=$(date +%s)
    local duration=$((end - TIMER_START))
    log_info "Execution time: ${duration}s"
}

# ------------------------------------------------------------------------------
# Wise Rollback Framework
# ------------------------------------------------------------------------------
ROLLBACK_STACK=()

# Add a command to the TOP of the rollback stack
register_rollback() {
    local cmd="$1"
    # Prepend to array
    ROLLBACK_STACK=("$cmd" "${ROLLBACK_STACK[@]}")
    log_debug "Registered rollback: $cmd"
}

# Execute all registered rollbacks in reverse order
execute_rollbacks() {
    if [ ${#ROLLBACK_STACK[@]} -eq 0 ]; then
        return
    fi
    
    log_warn "🔄 Executing Rollback Stack (Total: ${#ROLLBACK_STACK[@]} commands)..."
    for cmd in "${ROLLBACK_STACK[@]}"; do
        log_warn "   ⏪ Undoing: $cmd"
        if ! eval "$cmd"; then
            log_error "      ⚠️  Rollback command failed: $cmd"
        fi
    done
    ROLLBACK_STACK=()
    log_info "✅ Rollback completed."
}

# Global failure handler to be used with trap
handle_error() {
    local exit_code=$1
    local line_no=$2
    
    log_error "CRITICAL: Script failed at line $line_no with exit code $exit_code"
    execute_rollbacks
    exit "$exit_code"
}
