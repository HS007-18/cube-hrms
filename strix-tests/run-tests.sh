#!/bin/bash
# Strix Test Runner for HRMS Application

set -e

BASE_URL="http://127.0.0.1:8081"
SUPER_ADMIN_URL="http://127.0.0.1:8081/super-admin/"
API_URL="http://127.0.0.1:8080"

echo "=========================================="
echo "HRMS Strix Test Suite"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "Super Admin URL: $SUPER_ADMIN_URL"
echo "API URL: $API_URL"
echo ""

# Check if services are running
check_service() {
    local name=$1
    local url=$2
    echo "Checking $name at $url..."
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|401\|403"; then
        echo "✅ $name is running"
        return 0
    else
        echo "❌ $name is NOT running"
        return 1
    fi
}

echo "Checking services..."
check_service "Frontend (Company)" "$BASE_URL"
check_service "Frontend (Super Admin)" "$SUPER_ADMIN_URL"
check_service "Backend API" "$API_URL/health"
echo ""

# Run Strix tests
echo "=========================================="
echo "Running Strix Test Suites"
echo "=========================================="

# Create results directory
mkdir -p strix-results

# Run auth tests
echo ""
echo "📋 Running Authentication Tests..."
strix run strix-tests/auth.test.yaml \
  --base-url "$BASE_URL" \
  --output strix-results/auth-results.json \
  --reporter json || echo "Auth tests completed with errors"

# Run core HR tests
echo ""
echo "📋 Running Core HR Module Tests..."
strix run strix-tests/modules-core-hr.test.yaml \
  --base-url "$BASE_URL" \
  --output strix-results/core-hr-results.json \
  --reporter json || echo "Core HR tests completed with errors"

# Run HR Ops tests
echo ""
echo "📋 Running HR Operations Tests..."
strix run strix-tests/modules-hr-ops.test.yaml \
  --base-url "$BASE_URL" \
  --output strix-results/hr-ops-results.json \
  --reporter json || echo "HR Ops tests completed with errors"

# Run Employee Lifecycle tests
echo ""
echo "📋 Running Employee Lifecycle Tests..."
strix run strix-tests/modules-employee-lifecycle.test.yaml \
  --base-url "$BASE_URL" \
  --output strix-results/employee-lifecycle-results.json \
  --reporter json || echo "Employee Lifecycle tests completed with errors"

# Run Platform Admin tests
echo ""
echo "📋 Running Platform Admin Tests..."
strix run strix-tests/modules-platform-admin.test.yaml \
  --base-url "$SUPER_ADMIN_URL" \
  --output strix-results/platform-admin-results.json \
  --reporter json || echo "Platform Admin tests completed with errors"

# Run Security tests
echo ""
echo "📋 Running Security/RBAC Tests..."
strix run strix-tests/security.test.yaml \
  --base-url "$BASE_URL" \
  --output strix-results/security-results.json \
  --reporter json || echo "Security tests completed with errors"

echo ""
echo "=========================================="
echo "Test Execution Complete"
echo "=========================================="
echo "Results saved to strix-results/"
ls -la strix-results/

# Generate summary report
echo ""
echo "📊 Test Summary Report:"
echo "=========================================="

cat > strix-results/summary.md << 'EOF'
# HRMS Strix Test Execution Summary

## Test Suites Executed
1. Authentication Tests
2. Core HR Module Tests (Payroll, Recruitment, Onboarding)
3. HR Operations Tests (Reports, Documents, Notifications, Holidays)
4. Employee Lifecycle Tests (Goals, Offboarding, Support, Announcements)
5. Platform Admin Tests (Subscriptions, Tenant Analytics, Audit, System Health)
6. RBAC & Security Tests

## Results
EOF

# Add results to summary
for file in strix-results/*-results.json; do
    if [ -f "$file" ]; then
        echo "### $(basename "$file" .json)" >> strix-results/summary.md
        if command -v jq &> /dev/null; then
            jq -r '.testSuites[] | "- \(.name): \(.tests | length) tests, \(.tests | map(select(.passed == true)) | length) passed, \(.tests | map(select(.passed == false)) | length) failed"' "$file" >> strix-results/summary.md 2>/dev/null || echo "  (results format varies)" >> strix-results/summary.md
        else
            echo "  (install jq for detailed summary)" >> strix-results/summary.md
        fi
    fi
done

cat strix-results/summary.md

echo ""
echo "✅ Strix testing complete!"
echo "📁 Detailed results in strix-results/"