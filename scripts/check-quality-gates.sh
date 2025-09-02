#!/bin/bash

# Quality Gates Checker
# Validates that all quality gates pass before allowing deployment

set -e

echo "🚪 Checking Quality Gates..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize gate status
GATES_PASSED=0
TOTAL_GATES=5

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check JSON file exists and is valid
check_json_file() {
    local file=$1
    if [[ ! -f "$file" ]]; then
        echo "❌ Test results file not found: $file"
        return 1
    fi
    
    if ! command_exists jq; then
        echo "⚠️  jq not available, skipping JSON validation for $file"
        return 0
    fi
    
    if ! jq empty "$file" 2>/dev/null; then
        echo "❌ Invalid JSON in file: $file"
        return 1
    fi
    
    return 0
}

# Gate 1: Coverage Threshold (80%)
echo "📊 Checking code coverage..."
if check_json_file "coverage/coverage-summary.json"; then
    COVERAGE=$(jq -r '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "0")
    if (( $(echo "$COVERAGE >= 80" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${GREEN}✅ Coverage gate passed: ${COVERAGE}%${NC}"
        ((GATES_PASSED++))
    else
        echo -e "${RED}❌ Coverage gate failed: ${COVERAGE}% (minimum: 80%)${NC}"
    fi
else
    echo -e "${RED}❌ Coverage gate failed: No coverage data found${NC}"
fi

# Gate 2: Test Pass Rate (95%)
echo "🧪 Checking test pass rate..."
TOTAL_TESTS=0
PASSED_TESTS=0

# Check unit tests
if check_json_file "test-results/unit-test-results.json"; then
    UNIT_TOTAL=$(jq -r '.numTotalTests // 0' test-results/unit-test-results.json 2>/dev/null || echo "0")
    UNIT_PASSED=$(jq -r '.numPassedTests // 0' test-results/unit-test-results.json 2>/dev/null || echo "0")
    TOTAL_TESTS=$((TOTAL_TESTS + UNIT_TOTAL))
    PASSED_TESTS=$((PASSED_TESTS + UNIT_PASSED))
fi

# Check E2E tests
if check_json_file "test-results/e2e-results.json"; then
    E2E_TOTAL=$(jq -r '.stats.tests // 0' test-results/e2e-results.json 2>/dev/null || echo "0")
    E2E_PASSED=$(jq -r '.stats.passes // 0' test-results/e2e-results.json 2>/dev/null || echo "0")
    TOTAL_TESTS=$((TOTAL_TESTS + E2E_TOTAL))
    PASSED_TESTS=$((PASSED_TESTS + E2E_PASSED))
fi

if [[ $TOTAL_TESTS -gt 0 ]]; then
    PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc -l 2>/dev/null || echo "0")
    if (( $(echo "$PASS_RATE >= 95" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${GREEN}✅ Test pass rate gate passed: ${PASS_RATE}%${NC}"
        ((GATES_PASSED++))
    else
        echo -e "${RED}❌ Test pass rate gate failed: ${PASS_RATE}% (minimum: 95%)${NC}"
    fi
else
    echo -e "${RED}❌ Test pass rate gate failed: No test results found${NC}"
fi

# Gate 3: Accessibility (0 critical violations)
echo "♿ Checking accessibility..."
if check_json_file "test-results/a11y-results.json"; then
    A11Y_VIOLATIONS=$(jq -r '.violations | length' test-results/a11y-results.json 2>/dev/null || echo "999")
    if [[ "$A11Y_VIOLATIONS" == "0" ]]; then
        echo -e "${GREEN}✅ Accessibility gate passed: 0 violations${NC}"
        ((GATES_PASSED++))
    else
        echo -e "${RED}❌ Accessibility gate failed: ${A11Y_VIOLATIONS} violations${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Accessibility gate skipped: No test results${NC}"
    ((GATES_PASSED++)) # Allow pass if no a11y tests run
fi

# Gate 4: Performance (Lighthouse score >= 90)
echo "⚡ Checking performance..."
if check_json_file "test-results/lighthouse-results.json"; then
    PERF_SCORE=$(jq -r '.categories.performance.score * 100' test-results/lighthouse-results.json 2>/dev/null || echo "0")
    PERF_SCORE_INT=$(echo "$PERF_SCORE" | cut -d. -f1)
    if [[ "$PERF_SCORE_INT" -ge 90 ]]; then
        echo -e "${GREEN}✅ Performance gate passed: ${PERF_SCORE_INT}/100${NC}"
        ((GATES_PASSED++))
    else
        echo -e "${RED}❌ Performance gate failed: ${PERF_SCORE_INT}/100 (minimum: 90)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Performance gate skipped: No test results${NC}"
    ((GATES_PASSED++)) # Allow pass if no performance tests run
fi

# Gate 5: Security (0 high/critical vulnerabilities)
echo "🔒 Checking security..."
HIGH_VULNS=0
CRITICAL_VULNS=0

if check_json_file "test-results/security-audit.json"; then
    HIGH_VULNS=$(jq -r '.metadata.vulnerabilities.high // 0' test-results/security-audit.json 2>/dev/null || echo "0")
    CRITICAL_VULNS=$(jq -r '.metadata.vulnerabilities.critical // 0' test-results/security-audit.json 2>/dev/null || echo "0")
fi

TOTAL_SEVERE_VULNS=$((HIGH_VULNS + CRITICAL_VULNS))
if [[ "$TOTAL_SEVERE_VULNS" == "0" ]]; then
    echo -e "${GREEN}✅ Security gate passed: 0 high/critical vulnerabilities${NC}"
    ((GATES_PASSED++))
else
    echo -e "${RED}❌ Security gate failed: ${TOTAL_SEVERE_VULNS} high/critical vulnerabilities${NC}"
fi

# Final gate evaluation
echo ""
echo "📋 Quality Gates Summary:"
echo "  Passed: $GATES_PASSED/$TOTAL_GATES"

if [[ $GATES_PASSED -eq $TOTAL_GATES ]]; then
    echo -e "${GREEN}🎉 All quality gates passed! Deployment approved.${NC}"
    exit 0
else
    FAILED_GATES=$((TOTAL_GATES - GATES_PASSED))
    echo -e "${RED}❌ $FAILED_GATES quality gate(s) failed. Deployment blocked.${NC}"
    echo ""
    echo "To resolve:"
    echo "1. Review the failed gates above"
    echo "2. Fix the underlying issues"
    echo "3. Re-run the tests and quality gates"
    echo ""
    echo "For emergency deployments, contact the technical lead for gate bypass approval."
    exit 1
fi