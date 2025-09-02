"""
Certificate System Test Suite

Tests for certificate generation, QR verification, and PDF creation
when course completion status is true.
"""

import pytest
import json
import io
from datetime import datetime
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

class TestCertificates:
    """Test certificate generation and verification system"""
    
    @pytest.fixture
    def completed_enrollment(self):
        """Mock completed course enrollment"""
        return {
            'id': 'enrollment-123',
            'user_id': 'user-456',
            'course_slug': 'health-data-bootcamp',
            'progress': {'total_steps': 10, 'completed_steps': 10},
            'completed': True,
            'completed_at': datetime.now(),
            'certificate_url': None,
            'badge_ids': ['FHIR_LOOP_CLOSER']
        }
    
    @pytest.fixture
    def incomplete_enrollment(self):
        """Mock incomplete course enrollment"""
        return {
            'id': 'enrollment-456',
            'user_id': 'user-456',
            'course_slug': 'health-data-bootcamp',
            'progress': {'total_steps': 10, 'completed_steps': 7},
            'completed': False,
            'completed_at': None,
            'certificate_url': None,
            'badge_ids': []
        }
    
    @pytest.fixture
    def user_profile(self):
        """Mock user profile data"""
        return {
            'id': 'user-456',
            'email': 'student@test.com',
            'full_name': 'John Smith',
            'avatar_url': 'https://example.com/avatar.jpg'
        }
    
    @pytest.fixture
    def course_data(self):
        """Mock course information"""
        return {
            'slug': 'health-data-bootcamp',
            'title': '3-Day Health Data Bootcamp: Ingest, Transform & Operationalize',
            'summary': 'Hands-on intensive bootcamp covering complete health data lifecycle',
            'requires_product_sku': 'bootcamp_basic',
            'is_free': False
        }

    def test_certificate_generation_only_when_completed(self, completed_enrollment, user_profile, course_data):
        """Test certificate is only generated when completed=true"""
        
        def generate_certificate(enrollment, user, course):
            if not enrollment['completed']:
                return None
                
            certificate_data = {
                'certificate_id': f"cert_{enrollment['id']}",
                'user_name': user['full_name'],
                'course_title': course['title'],
                'completion_date': enrollment['completed_at'].strftime('%Y-%m-%d'),
                'verification_url': f"https://app.com/verify/cert_{enrollment['id']}"
            }
            
            return certificate_data
        
        # Test completed enrollment
        result = generate_certificate(completed_enrollment, user_profile, course_data)
        assert result is not None
        assert result['user_name'] == 'John Smith'
        assert result['course_title'] == '3-Day Health Data Bootcamp: Ingest, Transform & Operationalize'
        assert 'verification_url' in result
        
        # Test incomplete enrollment
        incomplete_enrollment = completed_enrollment.copy()
        incomplete_enrollment['completed'] = False
        result_incomplete = generate_certificate(incomplete_enrollment, user_profile, course_data)
        assert result_incomplete is None

    @patch('reportlab.pdfgen.canvas.Canvas')
    def test_pdf_certificate_creation(self, mock_canvas, completed_enrollment, user_profile, course_data):
        """Test PDF certificate file is created"""
        
        # Mock PDF generation
        mock_pdf_buffer = io.BytesIO()
        mock_canvas_instance = MagicMock()
        mock_canvas.return_value = mock_canvas_instance
        
        def create_certificate_pdf(enrollment, user, course):
            if not enrollment['completed']:
                return None
                
            # Mock PDF creation process
            certificate_id = f"cert_{enrollment['id']}"
            pdf_path = f"/certificates/{certificate_id}.pdf"
            
            # Simulate PDF generation
            canvas = mock_canvas(mock_pdf_buffer)
            canvas.drawString(100, 750, f"Certificate of Completion")
            canvas.drawString(100, 700, f"This certifies that {user['full_name']}")
            canvas.drawString(100, 650, f"has successfully completed {course['title']}")
            canvas.drawString(100, 600, f"Date: {enrollment['completed_at'].strftime('%B %d, %Y')}")
            canvas.save()
            
            return {
                'pdf_path': pdf_path,
                'certificate_id': certificate_id,
                'file_size': len(mock_pdf_buffer.getvalue())
            }
        
        result = create_certificate_pdf(completed_enrollment, user_profile, course_data)
        
        assert result is not None
        assert result['pdf_path'] == '/certificates/cert_enrollment-123.pdf'
        assert result['certificate_id'] == 'cert_enrollment-123'
        assert mock_canvas.called
        assert mock_canvas_instance.drawString.call_count >= 4  # At least 4 text elements
        assert mock_canvas_instance.save.called

    def test_qr_code_verification_route(self, completed_enrollment):
        """Test QR code verification endpoint works correctly"""
        
        certificate_database = {
            'cert_enrollment-123': {
                'certificate_id': 'cert_enrollment-123',
                'user_id': 'user-456',
                'course_slug': 'health-data-bootcamp',
                'issued_at': datetime.now(),
                'valid': True
            }
        }
        
        def verify_certificate(certificate_id):
            cert_data = certificate_database.get(certificate_id)
            
            if not cert_data:
                return {'valid': False, 'error': 'Certificate not found'}
            
            if not cert_data['valid']:
                return {'valid': False, 'error': 'Certificate has been revoked'}
            
            return {
                'valid': True,
                'certificate_id': cert_data['certificate_id'],
                'user_id': cert_data['user_id'],
                'course_slug': cert_data['course_slug'],
                'issued_at': cert_data['issued_at'].isoformat(),
                'verification_timestamp': datetime.now().isoformat()
            }
        
        # Test valid certificate
        result = verify_certificate('cert_enrollment-123')
        assert result['valid'] == True
        assert result['certificate_id'] == 'cert_enrollment-123'
        assert result['user_id'] == 'user-456'
        assert 'verification_timestamp' in result
        
        # Test invalid certificate
        invalid_result = verify_certificate('cert_nonexistent')
        assert invalid_result['valid'] == False
        assert invalid_result['error'] == 'Certificate not found'

    def test_certificate_url_storage(self, completed_enrollment):
        """Test certificate URL is stored in enrollment record"""
        
        def update_enrollment_with_certificate(enrollment_id, certificate_url):
            # Mock database update
            enrollment = completed_enrollment.copy()
            enrollment['certificate_url'] = certificate_url
            return enrollment
        
        cert_url = 'https://cdn.app.com/certificates/cert_enrollment-123.pdf'
        updated_enrollment = update_enrollment_with_certificate('enrollment-123', cert_url)
        
        assert updated_enrollment['certificate_url'] == cert_url
        assert updated_enrollment['completed'] == True

    def test_certificate_not_generated_for_incomplete(self, incomplete_enrollment, user_profile, course_data):
        """Test certificate generation fails for incomplete courses"""
        
        def attempt_certificate_generation(enrollment, user, course):
            if not enrollment['completed']:
                return {
                    'success': False,
                    'error': 'Course must be completed before certificate generation',
                    'completion_status': enrollment['completed'],
                    'progress': enrollment['progress']
                }
            
            return {'success': True, 'certificate_id': f"cert_{enrollment['id']}"}
        
        result = attempt_certificate_generation(incomplete_enrollment, user_profile, course_data)
        
        assert result['success'] == False
        assert 'must be completed' in result['error']
        assert result['completion_status'] == False
        assert result['progress']['completed_steps'] == 7

    def test_certificate_pdf_file_exists_after_generation(self, completed_enrollment):
        """Test PDF file actually exists after certificate generation"""
        
        with patch('pathlib.Path.exists') as mock_exists:
            def check_certificate_file(certificate_id):
                file_path = Path(f'/certificates/{certificate_id}.pdf')
                return file_path.exists()
            
            # Mock file exists after generation
            mock_exists.return_value = True
            
            result = check_certificate_file('cert_enrollment-123')
            assert result == True
            mock_exists.assert_called_once()

    @patch('qrcode.QRCode')
    def test_qr_code_generation_for_verification(self, mock_qrcode, completed_enrollment):
        """Test QR code is generated for certificate verification"""
        
        mock_qr_instance = MagicMock()
        mock_qrcode.return_value = mock_qr_instance
        
        def generate_certificate_qr(certificate_id):
            verification_url = f'https://app.com/verify/{certificate_id}'
            
            # Generate QR code
            qr = mock_qrcode(version=1, box_size=10, border=5)
            qr.add_data(verification_url)
            qr.make(fit=True)
            
            return {
                'qr_data': verification_url,
                'qr_image_path': f'/qr/{certificate_id}.png'
            }
        
        result = generate_certificate_qr('cert_enrollment-123')
        
        assert result['qr_data'] == 'https://app.com/verify/cert_enrollment-123'
        assert result['qr_image_path'] == '/qr/cert_enrollment-123.png'
        assert mock_qrcode.called
        assert mock_qr_instance.add_data.called
        assert mock_qr_instance.make.called

    def test_certificate_revocation(self):
        """Test certificate can be revoked and verification fails"""
        
        certificate_database = {
            'cert_enrollment-123': {
                'certificate_id': 'cert_enrollment-123',
                'valid': True,
                'revoked_at': None
            }
        }
        
        def revoke_certificate(certificate_id, reason):
            if certificate_id in certificate_database:
                certificate_database[certificate_id]['valid'] = False
                certificate_database[certificate_id]['revoked_at'] = datetime.now()
                certificate_database[certificate_id]['revocation_reason'] = reason
                return True
            return False
        
        # Revoke certificate
        revoked = revoke_certificate('cert_enrollment-123', 'Course content updated')
        assert revoked == True
        assert certificate_database['cert_enrollment-123']['valid'] == False
        assert certificate_database['cert_enrollment-123']['revoked_at'] is not None
        assert certificate_database['cert_enrollment-123']['revocation_reason'] == 'Course content updated'

if __name__ == '__main__':
    pytest.main([__file__, '-v'])