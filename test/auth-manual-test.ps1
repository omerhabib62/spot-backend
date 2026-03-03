# Manual auth module test script (PowerShell)
# Prerequisites: server running on localhost:3000
# Usage: powershell -ExecutionPolicy Bypass -File test/auth-manual-test.ps1

$ErrorActionPreference = "Stop"

$BASE_URL = "http://localhost:3000/api"
$TIMESTAMP = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL = "testuser-$TIMESTAMP@example.com"
$NAME = "Test User"
$PASS_COUNT = 0
$FAIL_COUNT = 0

function Write-Green($msg)  { Write-Host "  PASS: $msg" -ForegroundColor Green }
function Write-Red($msg)    { Write-Host "  FAIL: $msg" -ForegroundColor Red }
function Write-Bold($msg)   { Write-Host $msg -ForegroundColor White }

function Assert-Status($label, $expected, $actual) {
    if ($actual -eq $expected) {
        Write-Green "$label (HTTP $actual)"
        $script:PASS_COUNT++
    } else {
        Write-Red "$label - expected $expected, got $actual"
        $script:FAIL_COUNT++
    }
}

function Assert-JsonField($label, $obj, $field) {
    $value = $null
    try {
        $parts = $field -split '\.'
        $current = $obj
        foreach ($part in $parts) {
            if ($part -and $current) { $current = $current.$part }
        }
        $value = $current
    } catch {}

    if ($null -ne $value -and "$value" -ne "") {
        Write-Green "$label - .$field = $value"
        $script:PASS_COUNT++
    } else {
        Write-Red "$label - .$field is missing or null"
        $script:FAIL_COUNT++
    }
}

function Invoke-Api($method, $uri, $body = $null, $headers = @{}) {
    $params = @{
        Method = $method
        Uri = "$BASE_URL/$uri"
        ContentType = "application/json"
        ErrorAction = "Stop"
    }
    if ($body) {
        $params.Body = ($body | ConvertTo-Json -Compress)
    }
    if ($headers.Count -gt 0) {
        $params.Headers = $headers
    }
    try {
        $response = Invoke-WebRequest @params -UseBasicParsing
        return @{
            Status = [int]$response.StatusCode
            Body   = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
        }
    } catch {
        $status = 0
        $parsed = $null

        # Try ErrorDetails first (works in both PS 5.x and 7.x)
        if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
            try { $parsed = $_.ErrorDetails.Message | ConvertFrom-Json } catch {}
        }

        # Get status code
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode

            # Fallback: read response stream if ErrorDetails was empty
            if (-not $parsed) {
                try {
                    $stream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $content = $reader.ReadToEnd()
                    $reader.Close()
                    $parsed = $content | ConvertFrom-Json
                } catch {}
            }
        }

        return @{
            Status = $status
            Body   = $parsed
        }
    }
}

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 1: POST /api/auth/register with { email, name } -> 202 ==="

$res = Invoke-Api "POST" "auth/register" @{ email = $EMAIL; name = $NAME }

Assert-Status "Register returns 202" 202 $res.Status
Assert-JsonField "Register response" $res.Body "message"
Assert-JsonField "Register response" $res.Body "email"
Assert-JsonField "Register response" $res.Body "_dev_token"

$TOKEN1 = $res.Body._dev_token

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 2: Same register again -> 202 (not 409), different _dev_token ==="

$res = Invoke-Api "POST" "auth/register" @{ email = $EMAIL; name = $NAME }

Assert-Status "Duplicate register returns 202" 202 $res.Status

$TOKEN2 = $res.Body._dev_token
if ($TOKEN1 -ne $TOKEN2) {
    Write-Green "Different _dev_token returned ($TOKEN2)"
    $PASS_COUNT++
} else {
    Write-Red "Same _dev_token returned"
    $FAIL_COUNT++
}

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 3: POST /api/auth/verify with token -> 200 + full user object ==="

$res = Invoke-Api "POST" "auth/verify" @{ token = $TOKEN2 }

Assert-Status "Verify returns 200" 200 $res.Status
Assert-JsonField "Verify response" $res.Body "accessToken"
Assert-JsonField "Verify response" $res.Body "user.id"
Assert-JsonField "Verify response" $res.Body "user.email"
Assert-JsonField "Verify response" $res.Body "user.name"
Assert-JsonField "Verify response" $res.Body "user.role"
Assert-JsonField "Verify response" $res.Body "user.status"

$hasOnboarding = $res.Body.user.hasCompletedOnboarding
if ($null -ne $hasOnboarding) {
    Write-Green "Verify response - .user.hasCompletedOnboarding = $hasOnboarding"
    $PASS_COUNT++
} else {
    Write-Red "Verify response - .user.hasCompletedOnboarding is missing"
    $FAIL_COUNT++
}

$onboardingStep = $res.Body.user.onboardingCurrentStep
if ($null -ne $onboardingStep) {
    Write-Green "Verify response - .user.onboardingCurrentStep = $onboardingStep"
    $PASS_COUNT++
} else {
    Write-Red "Verify response - .user.onboardingCurrentStep is missing"
    $FAIL_COUNT++
}

$JWT = $res.Body.accessToken

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 4: Same verify again -> 401 'Token has already been used' ==="

$res = Invoke-Api "POST" "auth/verify" @{ token = $TOKEN2 }

Assert-Status "Re-verify returns 401" 401 $res.Status

$msg = $res.Body.message
if ($msg -match "already been used") {
    Write-Green "Error message is '$msg'"
    $PASS_COUNT++
} else {
    Write-Red "Expected 'Token has already been used', got '$msg'"
    $FAIL_COUNT++
}

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 5: Register twice, verify first (invalidated) token -> 401 ==="

$TIMESTAMP2 = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$EMAIL2 = "testuser2-$TIMESTAMP2@example.com"

$res = Invoke-Api "POST" "auth/register" @{ email = $EMAIL2; name = $NAME }
$FIRST_TOKEN = $res.Body._dev_token

# Register again - this invalidates the first token
$res = Invoke-Api "POST" "auth/register" @{ email = $EMAIL2; name = $NAME }

# Try to verify the first (now invalidated) token
$res = Invoke-Api "POST" "auth/verify" @{ token = $FIRST_TOKEN }

Assert-Status "Invalidated token returns 401" 401 $res.Status

$msg = $res.Body.message
if ($msg -match "invalidated") {
    Write-Green "Error message is '$msg'"
    $PASS_COUNT++
} else {
    Write-Red "Expected 'Token has been invalidated', got '$msg'"
    $FAIL_COUNT++
}

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 6: POST /api/auth/logout with JWT -> 204 ==="

$res = Invoke-Api "POST" "auth/logout" $null @{ Authorization = "Bearer $JWT" }

Assert-Status "Logout returns 204" 204 $res.Status

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 7: POST /api/auth/keep-alive with JWT -> 204 ==="

$res = Invoke-Api "POST" "auth/keep-alive" $null @{ Authorization = "Bearer $JWT" }

Assert-Status "Keep-alive returns 204" 204 $res.Status

# ─────────────────────────────────────────────
Write-Bold "`n=== Test 8: Register with old DTO shape -> 400 ==="

$res = Invoke-Api "POST" "auth/register" @{
    email = "oldshape@example.com"
    firstName = "Old"
    lastName = "Shape"
    organizationName = "Acme"
}

Assert-Status "Old DTO shape returns 400" 400 $res.Status

# ─────────────────────────────────────────────
Write-Bold "`n========================================="
Write-Bold "Results: $PASS_COUNT passed, $FAIL_COUNT failed"
Write-Bold "========================================="

if ($FAIL_COUNT -gt 0) { exit 1 }
