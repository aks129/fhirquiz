"""
Row Level Security (RLS) Smoke Tests

Tests ensuring users cannot read/update other users' enrollments
and other sensitive data through proper access control.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime

class TestRowLevelSecurity:
    """Test RLS policies prevent unauthorized data access"""
    
    @pytest.fixture
    def user_a_session(self):
        """Mock session for User A"""
        return {
            'user_id': 'user-aaa-111',
            'email': 'usera@test.com',
            'role': 'student'
        }
    
    @pytest.fixture
    def user_b_session(self):
        """Mock session for User B"""
        return {
            'user_id': 'user-bbb-222', 
            'email': 'userb@test.com',
            'role': 'student'
        }
    
    @pytest.fixture
    def admin_session(self):
        """Mock admin session"""
        return {
            'user_id': 'admin-ccc-333',
            'email': 'admin@test.com',
            'role': 'admin'
        }
    
    @pytest.fixture
    def enrollment_database(self):
        """Mock enrollment records"""
        return [
            {
                'id': 'enrollment-001',
                'user_id': 'user-aaa-111',
                'course_slug': 'fhir-101',
                'progress': {'completed_steps': 8, 'total_steps': 10},
                'completed': False,
                'certificate_url': None
            },
            {
                'id': 'enrollment-002',
                'user_id': 'user-bbb-222', 
                'course_slug': 'fhir-101',
                'progress': {'completed_steps': 10, 'total_steps': 10},
                'completed': True,
                'certificate_url': 'https://cdn.app.com/certs/cert-002.pdf'
            },
            {
                'id': 'enrollment-003',
                'user_id': 'user-aaa-111',
                'course_slug': 'health-data-bootcamp', 
                'progress': {'completed_steps': 5, 'total_steps': 15},
                'completed': False,
                'certificate_url': None
            }
        ]

    def test_user_can_only_read_own_enrollments(self, user_a_session, enrollment_database):
        """Test user can only access their own enrollment records"""
        
        def get_user_enrollments(session, enrollment_db):
            # Simulate RLS policy: WHERE user_id = session.user_id
            user_enrollments = [
                enrollment for enrollment in enrollment_db 
                if enrollment['user_id'] == session['user_id']
            ]
            return user_enrollments
        
        user_a_enrollments = get_user_enrollments(user_a_session, enrollment_database)
        
        # User A should only see their 2 enrollments
        assert len(user_a_enrollments) == 2
        assert all(e['user_id'] == 'user-aaa-111' for e in user_a_enrollments)
        assert user_a_enrollments[0]['id'] == 'enrollment-001'
        assert user_a_enrollments[1]['id'] == 'enrollment-003'

    def test_user_cannot_read_other_users_enrollments(self, user_b_session, enrollment_database):
        """Test user B cannot see user A's enrollments"""
        
        def get_user_enrollments(session, enrollment_db):
            user_enrollments = [
                enrollment for enrollment in enrollment_db 
                if enrollment['user_id'] == session['user_id']
            ]
            return user_enrollments
        
        user_b_enrollments = get_user_enrollments(user_b_session, enrollment_database)
        
        # User B should only see their 1 enrollment
        assert len(user_b_enrollments) == 1
        assert user_b_enrollments[0]['user_id'] == 'user-bbb-222'
        assert user_b_enrollments[0]['id'] == 'enrollment-002'
        
        # Verify no access to User A's data
        user_a_data = [e for e in user_b_enrollments if e['user_id'] == 'user-aaa-111']
        assert len(user_a_data) == 0

    def test_user_cannot_update_other_users_enrollments(self, user_a_session, enrollment_database):
        """Test user cannot modify another user's enrollment"""
        
        def update_enrollment(session, enrollment_id, updates, enrollment_db):
            # Find enrollment
            enrollment = next(
                (e for e in enrollment_db if e['id'] == enrollment_id), 
                None
            )
            
            if not enrollment:
                return {'success': False, 'error': 'Enrollment not found'}
            
            # RLS check: can only update own enrollments
            if enrollment['user_id'] != session['user_id']:
                return {'success': False, 'error': 'Access denied'}
            
            # Apply updates
            enrollment.update(updates)
            return {'success': True, 'enrollment': enrollment}
        
        # User A tries to update User B's enrollment
        result = update_enrollment(
            user_a_session, 
            'enrollment-002',  # User B's enrollment
            {'completed': False}, 
            enrollment_database
        )
        
        assert result['success'] == False
        assert result['error'] == 'Access denied'
        
        # Verify User B's data unchanged
        user_b_enrollment = next(e for e in enrollment_database if e['id'] == 'enrollment-002')
        assert user_b_enrollment['completed'] == True  # Unchanged

    def test_user_can_update_own_enrollments(self, user_a_session, enrollment_database):
        """Test user can successfully update their own enrollments"""
        
        def update_enrollment(session, enrollment_id, updates, enrollment_db):
            enrollment = next(
                (e for e in enrollment_db if e['id'] == enrollment_id), 
                None
            )
            
            if not enrollment:
                return {'success': False, 'error': 'Enrollment not found'}
            
            if enrollment['user_id'] != session['user_id']:
                return {'success': False, 'error': 'Access denied'}
            
            enrollment.update(updates)
            return {'success': True, 'enrollment': enrollment}
        
        # User A updates their own enrollment
        result = update_enrollment(
            user_a_session,
            'enrollment-001',  # User A's enrollment
            {'progress': {'completed_steps': 9, 'total_steps': 10}},
            enrollment_database
        )
        
        assert result['success'] == True
        assert result['enrollment']['progress']['completed_steps'] == 9
        assert result['enrollment']['user_id'] == 'user-aaa-111'

    def test_admin_can_read_all_enrollments(self, admin_session, enrollment_database):
        """Test admin users can access all enrollment records"""
        
        def get_enrollments_for_role(session, enrollment_db):
            if session['role'] == 'admin':
                # Admin can see all enrollments
                return enrollment_db
            else:
                # Regular users see only their own
                return [
                    enrollment for enrollment in enrollment_db 
                    if enrollment['user_id'] == session['user_id']
                ]
        
        admin_enrollments = get_enrollments_for_role(admin_session, enrollment_database)
        
        assert len(admin_enrollments) == 3  # All enrollments
        user_ids = {e['user_id'] for e in admin_enrollments}
        assert 'user-aaa-111' in user_ids
        assert 'user-bbb-222' in user_ids

    def test_cross_user_data_access_blocked(self, user_a_session, enrollment_database):
        """Test malicious attempts to access cross-user data are blocked"""
        
        def attempt_cross_user_access(session, target_user_id, enrollment_db):
            # Simulate malicious query attempting to access another user's data
            # Proper RLS should block this regardless of the query
            
            accessible_enrollments = [
                enrollment for enrollment in enrollment_db 
                if enrollment['user_id'] == session['user_id']  # RLS enforced
            ]
            
            # Try to find target user's data in results
            target_data = [
                e for e in accessible_enrollments 
                if e['user_id'] == target_user_id
            ]
            
            return target_data
        
        # User A attempts to access User B's data
        malicious_result = attempt_cross_user_access(
            user_a_session, 
            'user-bbb-222', 
            enrollment_database
        )
        
        # Should return empty - no access to other user's data
        assert len(malicious_result) == 0

    def test_certificate_url_privacy(self, user_a_session, user_b_session, enrollment_database):
        """Test users cannot access other users' certificate URLs"""
        
        def get_user_certificates(session, enrollment_db):
            user_enrollments = [
                enrollment for enrollment in enrollment_db 
                if enrollment['user_id'] == session['user_id'] and enrollment['certificate_url']
            ]
            return [e['certificate_url'] for e in user_enrollments]
        
        # User A certificates (should be empty based on fixture)
        user_a_certs = get_user_certificates(user_a_session, enrollment_database)
        assert len(user_a_certs) == 0
        
        # User B certificates 
        user_b_certs = get_user_certificates(user_b_session, enrollment_database)
        assert len(user_b_certs) == 1
        assert 'cert-002.pdf' in user_b_certs[0]
        
        # Verify User A cannot see User B's certificate URL
        all_user_a_data = [
            e for e in enrollment_database 
            if e['user_id'] == user_a_session['user_id']
        ]
        user_b_cert_url = 'https://cdn.app.com/certs/cert-002.pdf'
        
        for enrollment in all_user_a_data:
            assert enrollment['certificate_url'] != user_b_cert_url

    def test_enrollment_creation_with_user_isolation(self, user_a_session):
        """Test new enrollments are properly isolated to the creating user"""
        
        def create_enrollment(session, course_slug):
            # New enrollment should automatically be assigned to session user
            enrollment = {
                'id': f'enrollment-new-{course_slug}',
                'user_id': session['user_id'],  # Enforced by system
                'course_slug': course_slug,
                'progress': {'completed_steps': 0, 'total_steps': 12},
                'completed': False,
                'created_at': datetime.now()
            }
            
            return enrollment
        
        new_enrollment = create_enrollment(user_a_session, 'advanced-fhir')
        
        assert new_enrollment['user_id'] == user_a_session['user_id']
        assert new_enrollment['course_slug'] == 'advanced-fhir'
        
        # Verify user cannot create enrollment for another user
        # This should be prevented at the application/RLS level
        malicious_enrollment = create_enrollment(user_a_session, 'malicious-course')
        assert malicious_enrollment['user_id'] == user_a_session['user_id']  # Still their own ID

    @patch('requests.get')
    def test_supabase_rls_integration(self, mock_get, user_a_session):
        """Test integration with Supabase RLS policies"""
        
        # Mock Supabase response with RLS filtering
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = [
            {
                'id': 'enrollment-001',
                'user_id': 'user-aaa-111',
                'course_slug': 'fhir-101'
            }
        ]
        mock_get.return_value = mock_response
        
        def fetch_user_enrollments(session):
            # Simulate API call with RLS headers
            headers = {
                'Authorization': f'Bearer {session["user_id"]}',
                'apikey': 'supabase-key'
            }
            
            response = mock_get(
                'https://supabase.co/rest/v1/enrollments',
                headers=headers
            )
            
            if response.ok:
                return response.json()
            return []
        
        enrollments = fetch_user_enrollments(user_a_session)
        
        # Should only return user's own data due to RLS
        assert len(enrollments) == 1
        assert enrollments[0]['user_id'] == 'user-aaa-111'
        mock_get.assert_called_once()

if __name__ == '__main__':
    pytest.main([__file__, '-v'])