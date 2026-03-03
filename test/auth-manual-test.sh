#!/usr/bin/env bash
# Manual auth module test script
# Prerequisites: server running on localhost:3000
# Usage: bash test/auth-manual-test.sh

set -euo pipefail

BASE_URL="http://localhost:3000/api"
EMAIL="testuser-$(date +%s)@example.com"
NAME="Test User"
PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" -eq "$expected" ]; then
    green "  PASS: $label (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $label — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_json_field() {
  local label="$1" body="$2" field="$3"
  local value
  value=$(echo "$body" | jq -r "$field" 2>/dev/null)
  if [ -n "$value" ] && [ "$value" != "null" ]; then
    green "  PASS: $label — $field = $value"
    PASS=$((PASS + 1))
  else
    red "  FAIL: $label — $field is missing or null"
    FAIL=$((FAIL + 1))
  fi
}

# ─────────────────────────────────────────────
bold "=== Test 1: POST /api/auth/register with { email, name } → 202 ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"name\": \"$NAME\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Register returns 202" 202 "$STATUS"
assert_json_field "Register response" "$BODY" ".message"
assert_json_field "Register response" "$BODY" ".email"
assert_json_field "Register response" "$BODY" "._dev_token"

TOKEN1=$(echo "$BODY" | jq -r '._dev_token')

# ─────────────────────────────────────────────
bold ""
bold "=== Test 2: Same register again → 202 (not 409), different _dev_token ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"name\": \"$NAME\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Duplicate register returns 202" 202 "$STATUS"

TOKEN2=$(echo "$BODY" | jq -r '._dev_token')
if [ "$TOKEN1" != "$TOKEN2" ]; then
  green "  PASS: Different _dev_token returned ($TOKEN2)"
  PASS=$((PASS + 1))
else
  red "  FAIL: Same _dev_token returned"
  FAIL=$((FAIL + 1))
fi

# ─────────────────────────────────────────────
bold ""
bold "=== Test 3: POST /api/auth/verify with token → 200 + full user object ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN2\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Verify returns 200" 200 "$STATUS"
assert_json_field "Verify response" "$BODY" ".accessToken"
assert_json_field "Verify response" "$BODY" ".user.id"
assert_json_field "Verify response" "$BODY" ".user.email"
assert_json_field "Verify response" "$BODY" ".user.name"
assert_json_field "Verify response" "$BODY" ".user.role"
assert_json_field "Verify response" "$BODY" ".user.status"
assert_json_field "Verify response" "$BODY" ".user.hasCompletedOnboarding"
assert_json_field "Verify response" "$BODY" ".user.onboardingCurrentStep"

JWT=$(echo "$BODY" | jq -r '.accessToken')

# ─────────────────────────────────────────────
bold ""
bold "=== Test 4: Same verify again → 401 'Token has already been used' ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN2\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Re-verify returns 401" 401 "$STATUS"

MSG=$(echo "$BODY" | jq -r '.message')
if echo "$MSG" | grep -qi "already been used"; then
  green "  PASS: Error message is '$MSG'"
  PASS=$((PASS + 1))
else
  red "  FAIL: Expected 'Token has already been used', got '$MSG'"
  FAIL=$((FAIL + 1))
fi

# ─────────────────────────────────────────────
bold ""
bold "=== Test 5: Register twice, verify first (invalidated) token → 401 ==="

EMAIL2="testuser2-$(date +%s)@example.com"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL2\", \"name\": \"$NAME\"}")
BODY=$(echo "$RESPONSE" | sed '$d')
FIRST_TOKEN=$(echo "$BODY" | jq -r '._dev_token')

# Register again — this invalidates the first token
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL2\", \"name\": \"$NAME\"}")

# Try to verify the first (now invalidated) token
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/verify" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$FIRST_TOKEN\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Invalidated token returns 401" 401 "$STATUS"

MSG=$(echo "$BODY" | jq -r '.message')
if echo "$MSG" | grep -qi "invalidated"; then
  green "  PASS: Error message is '$MSG'"
  PASS=$((PASS + 1))
else
  red "  FAIL: Expected 'Token has been invalidated', got '$MSG'"
  FAIL=$((FAIL + 1))
fi

# ─────────────────────────────────────────────
bold ""
bold "=== Test 6: POST /api/auth/logout with JWT → 204 ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Logout returns 204" 204 "$STATUS"

# ─────────────────────────────────────────────
bold ""
bold "=== Test 7: POST /api/auth/keep-alive with JWT → 204 ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/keep-alive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Keep-alive returns 204" 204 "$STATUS"

# ─────────────────────────────────────────────
bold ""
bold "=== Test 8: Register with old DTO shape → 400 ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"oldshape@example.com\", \"firstName\": \"Old\", \"lastName\": \"Shape\", \"organizationName\": \"Acme\"}")

BODY=$(echo "$RESPONSE" | sed '$d')
STATUS=$(echo "$RESPONSE" | tail -1)

assert_status "Old DTO shape returns 400" 400 "$STATUS"

# ─────────────────────────────────────────────
bold ""
bold "========================================="
bold "Results: $PASS passed, $FAIL failed"
bold "========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
