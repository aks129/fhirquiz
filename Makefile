# Docker operations
up:
        docker compose up -d --build

down:
        docker compose down

logs:
        docker compose logs -f local-hapi

seed:
        curl -s http://localhost:5000/ops/seed-local-fhir | cat

# QA Operations
.PHONY: qa-setup qa-unit qa-integration qa-e2e qa-accessibility qa-performance qa-security qa-all qa-report qa-clean

# Setup QA environment
qa-setup:
        @echo "🔧 Setting up QA environment..."
        npm ci
        npx playwright install --with-deps
        mkdir -p test-results qa-reports
        docker compose up -d --build
        @echo "✅ QA environment ready"

# Unit tests with coverage
qa-unit:
        @echo "🧪 Running unit tests..."
        npx vitest run --coverage --reporter=json --outputFile=test-results/unit-test-results.json
        @echo "✅ Unit tests completed"

# Backend integration tests
qa-integration:
        @echo "🔗 Running integration tests..."
        npx vitest run tests/backend/ --reporter=json --outputFile=test-results/backend-results.json
        @echo "✅ Integration tests completed"

# FHIR server tests
qa-fhir:
        @echo "🏥 Running FHIR server tests..."
        @timeout 300 bash -c 'until curl -f http://localhost:8080/fhir/metadata >/dev/null 2>&1; do sleep 5; echo "Waiting for FHIR server..."; done'
        npx vitest run tests/fhir-*.test.ts --reporter=json --outputFile=test-results/fhir-results.json
        @echo "✅ FHIR tests completed"

# End-to-end tests
qa-e2e:
        @echo "🎭 Running E2E tests..."
        @timeout 300 bash -c 'until curl -f http://localhost:5000 >/dev/null 2>&1; do sleep 5; echo "Waiting for application..."; done'
        npx playwright test --reporter=json --outputFile=test-results/e2e-results.json
        @echo "✅ E2E tests completed"

# Accessibility tests
qa-accessibility:
        @echo "♿ Running accessibility tests..."
        npx playwright test --grep "should be accessible" --reporter=json --outputFile=test-results/a11y-results.json
        @echo "✅ Accessibility tests completed"

# Performance tests
qa-performance:
        @echo "⚡ Running performance tests..."
        npm run build
        npx lighthouse http://localhost:5000 --output=json --output-path=test-results/lighthouse-results.json --chrome-flags="--headless" || true
        @echo "✅ Performance tests completed"

# Security tests
qa-security:
        @echo "🔒 Running security tests..."
        npm audit --audit-level=moderate --json > test-results/security-audit.json || true
        @echo "✅ Security tests completed"

# Run all QA tests
qa-all: qa-setup qa-unit qa-integration qa-fhir qa-e2e qa-accessibility qa-performance qa-security
        @echo "🎯 Running complete QA suite..."
        @echo "✅ All QA tests completed"

# Generate QA report
qa-report:
        @echo "📊 Generating QA report..."
        tsx scripts/qa-report-generator.ts
        @echo "✅ QA report generated"

# Full QA pipeline with report
qa-pipeline: qa-all qa-report
        @echo "🚀 QA Pipeline completed successfully"
        @echo "📄 View report: qa-reports/qa-report.html"

# Clean up test artifacts
qa-clean:
        @echo "🧹 Cleaning up test artifacts..."
        rm -rf test-results/* qa-reports/* coverage playwright-report
        @echo "✅ Cleanup completed"

# Quality gate checks
qa-gates:
        @echo "🚪 Checking quality gates..."
        @bash scripts/check-quality-gates.sh
        @echo "✅ Quality gates validation completed"

# Quick QA check (fast subset for development)
qa-quick:
        @echo "⚡ Running quick QA checks..."
        npm run check
        npx vitest run --coverage.enabled=false
        npx playwright test --grep "should load homepage"
        @echo "✅ Quick QA check completed"

# Help
qa-help:
        @echo "Available QA targets:"
        @echo "  qa-setup        - Setup QA environment"
        @echo "  qa-unit         - Run unit tests"
        @echo "  qa-integration  - Run integration tests"
        @echo "  qa-fhir         - Run FHIR server tests"
        @echo "  qa-e2e          - Run E2E tests"
        @echo "  qa-accessibility- Run accessibility tests"
        @echo "  qa-performance  - Run performance tests"
        @echo "  qa-security     - Run security tests"
        @echo "  qa-all          - Run all QA tests"
        @echo "  qa-report       - Generate QA report"
        @echo "  qa-pipeline     - Run full QA pipeline"
        @echo "  qa-gates        - Check quality gates"
        @echo "  qa-quick        - Quick QA check"
        @echo "  qa-clean        - Clean test artifacts"
        @echo "  qa-help         - Show this help"