# QA Test Suite Documentation

Comprehensive test automation for the FHIR Healthcare Bootcamp platform covering both backend API endpoints and frontend user workflows.

## Overview

This test suite ensures quality and reliability across all major platform features:

### Backend Testing (pytest)
- **Authentication Guards**: require_user and require_admin middleware validation
- **Purchase State Machine**: Stripe webhook handling and payment lifecycle  
- **Certificate System**: PDF generation, QR verification, completion gating
- **Points System**: Award rules, redemption validation, balance management
- **Row Level Security**: Data isolation and access control enforcement

### Frontend Testing (Playwright)
- **Authentication Flows**: Google sign-in with mocked Supabase sessions
- **Course Gating**: Free access, paid blocking, trial expiration handling
- **Admin Console**: Role management, user operations, optimistic UI updates
- **Certificates & Badges**: UI appearance, verification flows, points display

## Test Structure

```
tests/
├── backend/                 # Python pytest tests
│   ├── auth_guards.py      # Authentication middleware tests
│   ├── purchases_state_machine.py  # Payment flow tests
│   ├── certificates.py     # Certificate generation tests
│   ├── points_system.py    # Gamification tests
│   └── rls_smoke_tests.py  # Security access tests
├── e2e/                    # Playwright frontend tests
│   ├── auth-flows.spec.ts  # Authentication UI tests
│   ├── course-gating.spec.ts # Access control tests
│   ├── admin-console.spec.ts # Admin functionality tests
│   └── certificates-badges.spec.ts # Achievement UI tests
├── conftest.py             # pytest configuration and fixtures
├── pytest.ini             # pytest settings
└── run_tests.py           # Test runner script
```

## Running Tests

### All Tests
```bash
python tests/run_tests.py
```

### Backend Only
```bash
python -m pytest tests/backend/ -v
```

### Frontend Only  
```bash
npx playwright test tests/e2e/
```

### Specific Test Suites
```bash
# Backend specific
python tests/run_tests.py auth
python tests/run_tests.py payments
python tests/run_tests.py certificates
python tests/run_tests.py points
python tests/run_tests.py rls

# Frontend specific
python tests/run_tests.py frontend-auth
python tests/run_tests.py course-gating
python tests/run_tests.py admin
python tests/run_tests.py certificates-ui
```

## Backend Test Coverage

### Authentication Guards (`auth_guards.py`)
✅ require_user allows authenticated users  
✅ require_user denies unauthenticated requests  
✅ require_admin allows admin users  
✅ require_admin denies student/instructor users  
✅ Profile fetching integration  

### Purchase State Machine (`purchases_state_machine.py`)
✅ Checkout completion creates active purchase  
✅ Subscription creation with trial period  
✅ Subscription cancellation state transition  
✅ Duplicate webhook prevention  
✅ Trial expiration handling  
✅ Stripe signature validation  

### Certificate System (`certificates.py`)
✅ Certificate generation only when completed=true  
✅ PDF creation with ReportLab  
✅ QR code verification endpoint  
✅ Certificate URL storage in enrollment  
✅ Incomplete course blocking  
✅ Certificate revocation support  

### Points System (`points_system.py`)  
✅ Quiz completion points awarded once only  
✅ BYOD badge points single award  
✅ Observation publishing multiple awards  
✅ Points redemption with balance validation  
✅ Insufficient balance blocking  
✅ Concurrent redemption prevention  
✅ Negative balance prevention  

### Row Level Security (`rls_smoke_tests.py`)
✅ Users can only read own enrollments  
✅ Cross-user data access blocked  
✅ Update permissions enforced  
✅ Admin access to all records  
✅ Certificate URL privacy  
✅ Supabase RLS integration  

## Frontend Test Coverage

### Authentication Flows (`auth-flows.spec.ts`)
✅ Google sign-in with mocked session injection  
✅ Logout functionality clears session  
✅ Protected routes redirect to login  
✅ Role-based access control for admin routes  
✅ Session persistence across page reloads  

### Course Gating (`course-gating.spec.ts`)
✅ Free courses accessible without purchase  
✅ Paid courses blocked until checkout  
✅ Course accessible after purchase  
✅ Trial subscription unlocks temporarily  
✅ Expired trial blocks access  
✅ Product hierarchy respects upgrade requirements  
✅ Checkout flow integration with Stripe  

### Admin Console (`admin-console.spec.ts`)
✅ Admin can change user roles with UI updates  
✅ Email search functionality  
✅ Product creation workflow  
✅ Badge assignment to users  
✅ Points granting with balance updates  
✅ Points deduction with validation  
✅ Error handling with optimistic rollback  
✅ User sorting by creation date  

### Certificates & Badges (`certificates-badges.spec.ts`)
✅ Certificate appears after course completion  
✅ Certificate not shown for incomplete courses  
✅ Badge appearance in user profile after earning  
✅ Points balance updates after earning badges  
✅ Certificate verification page functionality  
✅ Invalid certificate verification error handling  
✅ Badge collection page shows all earned badges  
✅ Certificate PDF download generation  

## Mock Data Strategy

### Backend Mocks
- **Stripe Webhooks**: Complete payloads for all event types
- **User Sessions**: Student, instructor, admin role variations
- **Database Operations**: In-memory storage simulation
- **External APIs**: Supabase and third-party service mocking

### Frontend Mocks
- **Authentication**: Supabase session injection via localStorage
- **API Responses**: Comprehensive mock data for all endpoints
- **File Downloads**: PDF certificate generation simulation
- **Real-time Updates**: Badge earning and points balance changes

## CI/CD Integration

The test suite runs automatically on:
- Pull request creation
- Push to main/develop branches
- Manual workflow dispatch

GitHub Actions workflow provides:
- Parallel backend and frontend test execution
- Test result reporting with artifacts
- Playwright test report generation
- Failure notifications and summaries

## Security Testing Focus

Special attention to:
- **Row Level Security**: Ensuring users cannot access other users' data
- **Authorization Guards**: Proper role-based access enforcement  
- **Payment Security**: Stripe webhook signature validation
- **Session Management**: Proper authentication state handling
- **Input Validation**: Malicious input prevention

## Performance Considerations

Tests designed for:
- **Fast Execution**: Mocked external dependencies
- **Reliable Results**: No flaky network calls
- **Parallel Execution**: Independent test isolation
- **Resource Efficiency**: Minimal setup/teardown overhead

## Adding New Tests

### Backend Test Pattern
```python
class TestNewFeature:
    @pytest.fixture
    def mock_data(self):
        return {"key": "value"}
    
    def test_happy_path(self, mock_data):
        # Test implementation
        assert result == expected
    
    def test_error_case(self, mock_data):  
        # Error handling test
        assert error_raised
```

### Frontend Test Pattern
```typescript
test.describe('New Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Mock setup
    await page.route('**/api/endpoint', async (route) => {
      await route.fulfill({ /* mock response */ });
    });
  });

  test('feature works correctly', async ({ page }) => {
    await page.goto('/feature');
    const element = page.locator('[data-testid="target"]');
    await expect(element).toBeVisible();
  });
});
```

## Test Maintenance

Regular tasks:
- **Mock Data Updates**: Keep in sync with API changes
- **Test Coverage Review**: Identify gaps in critical paths  
- **Performance Monitoring**: Optimize slow-running tests
- **CI Pipeline Health**: Monitor and fix pipeline issues
- **Documentation Updates**: Keep test docs current with features