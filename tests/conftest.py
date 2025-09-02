"""
Global pytest configuration and fixtures
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
import os
from datetime import datetime, timedelta

# Test environment configuration
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Configure test environment variables"""
    test_env = {
        'NODE_ENV': 'test',
        'VITE_SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
        'STRIPE_SECRET_KEY': 'sk_test_123',
        'STRIPE_WEBHOOK_SECRET': 'whsec_test_123',
        'DATABASE_URL': 'postgresql://test:test@localhost:5432/test_db'
    }
    
    with patch.dict(os.environ, test_env):
        yield

# Common mock data fixtures
@pytest.fixture
def mock_student_user():
    """Standard student user for testing"""
    return {
        'id': 'user-student-123',
        'email': 'student@test.com',
        'full_name': 'Test Student',
        'role': 'student',
        'fhir_points': 150,
        'created_at': datetime.now() - timedelta(days=10)
    }

@pytest.fixture
def mock_admin_user():
    """Standard admin user for testing"""
    return {
        'id': 'user-admin-456',
        'email': 'admin@test.com',
        'full_name': 'Test Admin',
        'role': 'admin',
        'fhir_points': 1000,
        'created_at': datetime.now() - timedelta(days=30)
    }

@pytest.fixture
def mock_instructor_user():
    """Standard instructor user for testing"""
    return {
        'id': 'user-instructor-789',
        'email': 'instructor@test.com',
        'full_name': 'Test Instructor',
        'role': 'instructor',
        'fhir_points': 500,
        'created_at': datetime.now() - timedelta(days=20)
    }

@pytest.fixture
def mock_course_data():
    """Standard course data for testing"""
    return {
        'slug': 'health-data-bootcamp',
        'title': '3-Day Health Data Bootcamp',
        'summary': 'Comprehensive FHIR training program',
        'is_free': False,
        'requires_product_sku': 'bootcamp_basic',
        'total_steps': 15
    }

@pytest.fixture
def mock_free_course():
    """Free course for testing access controls"""
    return {
        'slug': 'fhir-101',
        'title': 'FHIR Fundamentals',
        'summary': 'Introduction to FHIR basics',
        'is_free': True,
        'requires_product_sku': None,
        'total_steps': 8
    }

@pytest.fixture
def mock_purchase_active():
    """Active purchase for testing"""
    return {
        'id': 'purchase-active-123',
        'user_id': 'user-student-123',
        'product_sku': 'bootcamp_basic',
        'status': 'active',
        'amount_paid': 29900,  # $299.00 in cents
        'stripe_session_id': 'cs_test_session_123',
        'created_at': datetime.now() - timedelta(days=5)
    }

@pytest.fixture
def mock_subscription_trialing():
    """Trialing subscription for testing"""
    return {
        'id': 'subscription-trial-456',
        'user_id': 'user-student-123',
        'product_sku': 'bootcamp_plus',
        'status': 'trialing',
        'stripe_subscription_id': 'sub_test_123',
        'trial_ends_at': datetime.now() + timedelta(days=7),
        'created_at': datetime.now() - timedelta(days=1)
    }

@pytest.fixture
def mock_enrollment_completed():
    """Completed enrollment for certificate testing"""
    return {
        'id': 'enrollment-completed-789',
        'user_id': 'user-student-123',
        'course_slug': 'health-data-bootcamp',
        'progress': {'total_steps': 15, 'completed_steps': 15},
        'completed': True,
        'completed_at': datetime.now() - timedelta(hours=2),
        'certificate_url': 'https://cdn.app.com/certificates/cert_enrollment-789.pdf'
    }

@pytest.fixture
def mock_badges_earned():
    """Earned badges for testing"""
    return [
        {
            'id': 'FHIR_LOOP_CLOSER',
            'name': 'FHIR Loop Closer',
            'description': 'Successfully completed full FHIR data lifecycle',
            'points_value': 75,
            'earned_at': datetime.now() - timedelta(days=2)
        },
        {
            'id': 'QUIZ_MASTER',
            'name': 'Quiz Master',
            'description': 'Achieved perfect scores on all quizzes',
            'points_value': 25,
            'earned_at': datetime.now() - timedelta(days=5)
        }
    ]

# Database fixtures
@pytest.fixture
def mock_database():
    """In-memory test database"""
    return {
        'users': [],
        'purchases': [],
        'enrollments': [],
        'badges': [],
        'points_history': [],
        'certificates': []
    }

# API mocking helpers
@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing"""
    client = Mock()
    
    # Mock auth methods
    client.auth.get_user.return_value = Mock(data={'user': None})
    client.auth.get_session.return_value = Mock(data={'session': None})
    
    # Mock table operations
    def mock_table(table_name):
        table_mock = Mock()
        table_mock.select.return_value = table_mock
        table_mock.insert.return_value = table_mock
        table_mock.update.return_value = table_mock
        table_mock.delete.return_value = table_mock
        table_mock.eq.return_value = table_mock
        table_mock.execute.return_value = Mock(data=[], error=None)
        return table_mock
    
    client.table = mock_table
    return client

@pytest.fixture
def mock_stripe_client():
    """Mock Stripe client for testing"""
    stripe_mock = Mock()
    
    # Mock checkout sessions
    stripe_mock.checkout.Session.create.return_value = Mock(
        id='cs_test_session',
        url='https://checkout.stripe.com/pay/test'
    )
    
    # Mock webhooks
    stripe_mock.Webhook.construct_event.return_value = {
        'id': 'evt_test',
        'type': 'checkout.session.completed',
        'data': {'object': {'id': 'cs_test_session'}}
    }
    
    return stripe_mock

# Async testing support
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Test data cleanup
@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data after each test"""
    yield
    # Cleanup logic would go here if needed
    pass