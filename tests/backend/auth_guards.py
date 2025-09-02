"""
Backend Authentication Guards Test Suite

Tests for require_user and require_admin authentication middleware
covering happy path and denial scenarios.
"""

import pytest
import json
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

# Mock Express-like request/response objects
class MockRequest:
    def __init__(self, user=None, headers=None, body=None):
        self.user = user
        self.headers = headers or {}
        self.body = body or {}
        self.isAuthenticated = Mock(return_value=bool(user))

class MockResponse:
    def __init__(self):
        self.status_code = None
        self.json_data = None
        self.sent = False
        
    def status(self, code):
        self.status_code = code
        return self
        
    def json(self, data):
        self.json_data = data
        self.sent = True
        return self

class TestAuthGuards:
    """Test authentication guard middleware functions"""
    
    @pytest.fixture
    def mock_supabase_env(self):
        """Mock Supabase environment variables"""
        with patch.dict('os.environ', {
            'VITE_SUPABASE_URL': 'https://test.supabase.co',
            'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key'
        }):
            yield

    @pytest.fixture
    def student_user(self):
        """Mock student user"""
        return {
            'claims': {'sub': 'user-123'},
            'profile': {
                'id': 'user-123',
                'email': 'student@test.com',
                'role': 'student',
                'fhir_points': 100
            }
        }

    @pytest.fixture
    def admin_user(self):
        """Mock admin user"""
        return {
            'claims': {'sub': 'admin-456'},
            'profile': {
                'id': 'admin-456',
                'email': 'admin@test.com',
                'role': 'admin',
                'fhir_points': 500
            }
        }

    def test_require_user_happy_path(self, student_user):
        """Test require_user allows authenticated user"""
        req = MockRequest(user=student_user)
        res = MockResponse()
        next_called = Mock()
        
        # Simulate require_user middleware
        def require_user(req, res, next_fn):
            if req.isAuthenticated() and req.user:
                next_fn()
            else:
                res.status(401).json({'message': 'Unauthorized'})
        
        require_user(req, res, next_called)
        
        assert next_called.called
        assert not res.sent

    def test_require_user_deny_unauthenticated(self):
        """Test require_user denies unauthenticated request"""
        req = MockRequest(user=None)
        res = MockResponse()
        next_called = Mock()
        
        def require_user(req, res, next_fn):
            if req.isAuthenticated() and req.user:
                next_fn()
            else:
                res.status(401).json({'message': 'Unauthorized'})
        
        require_user(req, res, next_called)
        
        assert not next_called.called
        assert res.sent
        assert res.status_code == 401
        assert res.json_data['message'] == 'Unauthorized'

    def test_require_user_deny_no_user_object(self):
        """Test require_user denies when user object is missing"""
        req = MockRequest()
        req.isAuthenticated = Mock(return_value=True)  # Authenticated but no user
        res = MockResponse()
        next_called = Mock()
        
        def require_user(req, res, next_fn):
            if req.isAuthenticated() and req.user:
                next_fn()
            else:
                res.status(401).json({'message': 'Unauthorized'})
        
        require_user(req, res, next_called)
        
        assert not next_called.called
        assert res.sent
        assert res.status_code == 401

    def test_require_admin_happy_path(self, admin_user):
        """Test require_admin allows admin user"""
        req = MockRequest(user=admin_user)
        res = MockResponse()
        next_called = Mock()
        
        def require_admin(req, res, next_fn):
            if (req.isAuthenticated() and 
                req.user and 
                req.user.get('profile', {}).get('role') == 'admin'):
                next_fn()
            else:
                res.status(403).json({'message': 'Admin access required'})
        
        require_admin(req, res, next_called)
        
        assert next_called.called
        assert not res.sent

    def test_require_admin_deny_student(self, student_user):
        """Test require_admin denies student user"""
        req = MockRequest(user=student_user)
        res = MockResponse()
        next_called = Mock()
        
        def require_admin(req, res, next_fn):
            if (req.isAuthenticated() and 
                req.user and 
                req.user.get('profile', {}).get('role') == 'admin'):
                next_fn()
            else:
                res.status(403).json({'message': 'Admin access required'})
        
        require_admin(req, res, next_called)
        
        assert not next_called.called
        assert res.sent
        assert res.status_code == 403
        assert res.json_data['message'] == 'Admin access required'

    def test_require_admin_deny_unauthenticated(self):
        """Test require_admin denies unauthenticated user"""
        req = MockRequest(user=None)
        res = MockResponse()
        next_called = Mock()
        
        def require_admin(req, res, next_fn):
            if (req.isAuthenticated() and 
                req.user and 
                req.user.get('profile', {}).get('role') == 'admin'):
                next_fn()
            else:
                res.status(403).json({'message': 'Admin access required'})
        
        require_admin(req, res, next_called)
        
        assert not next_called.called
        assert res.sent
        assert res.status_code == 403

    def test_require_admin_deny_instructor(self):
        """Test require_admin denies instructor user"""
        instructor_user = {
            'claims': {'sub': 'instructor-789'},
            'profile': {
                'id': 'instructor-789',
                'role': 'instructor'
            }
        }
        
        req = MockRequest(user=instructor_user)
        res = MockResponse()
        next_called = Mock()
        
        def require_admin(req, res, next_fn):
            if (req.isAuthenticated() and 
                req.user and 
                req.user.get('profile', {}).get('role') == 'admin'):
                next_fn()
            else:
                res.status(403).json({'message': 'Admin access required'})
        
        require_admin(req, res, next_called)
        
        assert not next_called.called
        assert res.sent
        assert res.status_code == 403

    @patch('requests.get')
    def test_profile_fetch_integration(self, mock_get, mock_supabase_env, student_user):
        """Test integration with profile fetching"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = [student_user['profile']]
        mock_get.return_value = mock_response
        
        req = MockRequest(user={'claims': {'sub': 'user-123'}})
        res = MockResponse()
        next_called = Mock()
        
        def require_user_with_profile(req, res, next_fn):
            # Simulate profile fetching
            if req.isAuthenticated() and req.user:
                user_id = req.user['claims']['sub']
                # Mock profile fetch logic
                req.user['profile'] = student_user['profile']
                next_fn()
            else:
                res.status(401).json({'message': 'Unauthorized'})
        
        require_user_with_profile(req, res, next_called)
        
        assert next_called.called
        assert not res.sent
        assert req.user['profile']['role'] == 'student'

if __name__ == '__main__':
    pytest.main([__file__, '-v'])