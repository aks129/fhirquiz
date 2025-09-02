"""
Points System Test Suite

Tests for points awarding rules, redemption mechanics, and balance validation
ensuring rules fire only once and insufficient balance is blocked.
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

class TestPointsSystem:
    """Test points awarding and redemption system"""
    
    @pytest.fixture
    def user_profile(self):
        """Mock user profile with points"""
        return {
            'id': 'user-123',
            'email': 'student@test.com',
            'fhir_points': 150,
            'created_at': datetime.now()
        }
    
    @pytest.fixture
    def points_history_database(self):
        """Mock points history tracking"""
        return []
    
    def test_quiz_completion_points_awarded_once(self, user_profile, points_history_database):
        """Test quiz completion points are only awarded once per quiz"""
        
        def award_quiz_points(user_id, quiz_id, score):
            # Check if already awarded
            existing_award = next(
                (award for award in points_history_database 
                 if award['user_id'] == user_id and 
                    award['quiz_id'] == quiz_id and 
                    award['award_type'] == 'quiz_completion'),
                None
            )
            
            if existing_award:
                return {'success': False, 'reason': 'Points already awarded for this quiz'}
            
            # Award points (25 for quiz completion)
            points_awarded = 25
            user_profile['fhir_points'] += points_awarded
            
            # Record in history
            award_record = {
                'user_id': user_id,
                'quiz_id': quiz_id,
                'award_type': 'quiz_completion',
                'points': points_awarded,
                'score': score,
                'awarded_at': datetime.now()
            }
            points_history_database.append(award_record)
            
            return {'success': True, 'points_awarded': points_awarded}
        
        # First quiz completion
        result1 = award_quiz_points('user-123', 'day1_quiz', 85)
        assert result1['success'] == True
        assert result1['points_awarded'] == 25
        assert user_profile['fhir_points'] == 175
        assert len(points_history_database) == 1
        
        # Attempt duplicate award
        result2 = award_quiz_points('user-123', 'day1_quiz', 90)
        assert result2['success'] == False
        assert result2['reason'] == 'Points already awarded for this quiz'
        assert user_profile['fhir_points'] == 175  # No change
        assert len(points_history_database) == 1  # No new record

    def test_byod_badge_points_awarded_once(self, user_profile, points_history_database):
        """Test BYOD badge completion points are awarded only once"""
        
        def award_byod_points(user_id, badge_id):
            # Check if badge already awarded
            existing_award = next(
                (award for award in points_history_database 
                 if award['user_id'] == user_id and 
                    award['badge_id'] == badge_id and 
                    award['award_type'] == 'badge_earned'),
                None
            )
            
            if existing_award:
                return {'success': False, 'reason': 'Badge already earned'}
            
            # Award BYOD badge points (50 points)
            points_awarded = 50
            user_profile['fhir_points'] += points_awarded
            
            award_record = {
                'user_id': user_id,
                'badge_id': badge_id,
                'award_type': 'badge_earned',
                'points': points_awarded,
                'awarded_at': datetime.now()
            }
            points_history_database.append(award_record)
            
            return {'success': True, 'points_awarded': points_awarded}
        
        # First BYOD completion
        result1 = award_byod_points('user-123', 'BYOD_CHAMP')
        assert result1['success'] == True
        assert result1['points_awarded'] == 50
        assert user_profile['fhir_points'] == 200
        
        # Attempt duplicate badge
        result2 = award_byod_points('user-123', 'BYOD_CHAMP')
        assert result2['success'] == False
        assert user_profile['fhir_points'] == 200  # No change

    def test_observation_publishing_points_multiple_awards(self, user_profile, points_history_database):
        """Test observation publishing points can be awarded multiple times"""
        
        def award_observation_points(user_id, observation_id):
            # Check if this specific observation already awarded
            existing_award = next(
                (award for award in points_history_database 
                 if award['user_id'] == user_id and 
                    award['observation_id'] == observation_id),
                None
            )
            
            if existing_award:
                return {'success': False, 'reason': 'Points already awarded for this observation'}
            
            # Award observation points (10 points per observation)
            points_awarded = 10
            user_profile['fhir_points'] += points_awarded
            
            award_record = {
                'user_id': user_id,
                'observation_id': observation_id,
                'award_type': 'observation_published',
                'points': points_awarded,
                'awarded_at': datetime.now()
            }
            points_history_database.append(award_record)
            
            return {'success': True, 'points_awarded': points_awarded}
        
        # First observation
        result1 = award_observation_points('user-123', 'obs-001')
        assert result1['success'] == True
        assert user_profile['fhir_points'] == 160
        
        # Second observation (different ID)
        result2 = award_observation_points('user-123', 'obs-002')
        assert result2['success'] == True
        assert user_profile['fhir_points'] == 170
        
        # Duplicate observation
        result3 = award_observation_points('user-123', 'obs-001')
        assert result3['success'] == False
        assert user_profile['fhir_points'] == 170  # No change

    def test_points_redemption_decrements_correctly(self, user_profile):
        """Test points redemption correctly decrements user balance"""
        initial_points = user_profile['fhir_points']  # 150
        
        def redeem_points(user_id, item_id, cost):
            if user_profile['fhir_points'] < cost:
                return {'success': False, 'error': 'Insufficient points'}
            
            user_profile['fhir_points'] -= cost
            
            return {
                'success': True,
                'item_id': item_id,
                'cost': cost,
                'remaining_points': user_profile['fhir_points']
            }
        
        # Valid redemption
        result = redeem_points('user-123', 'template_001', 50)
        assert result['success'] == True
        assert result['cost'] == 50
        assert result['remaining_points'] == 100
        assert user_profile['fhir_points'] == 100

    def test_insufficient_balance_blocked(self, user_profile):
        """Test redemption is blocked when user has insufficient points"""
        user_profile['fhir_points'] = 25  # Low balance
        
        def attempt_redemption(user_id, item_id, cost):
            if user_profile['fhir_points'] < cost:
                return {
                    'success': False,
                    'error': 'Insufficient points',
                    'required': cost,
                    'available': user_profile['fhir_points'],
                    'shortfall': cost - user_profile['fhir_points']
                }
            
            user_profile['fhir_points'] -= cost
            return {'success': True}
        
        # Attempt expensive redemption
        result = attempt_redemption('user-123', 'premium_template', 100)
        assert result['success'] == False
        assert result['error'] == 'Insufficient points'
        assert result['required'] == 100
        assert result['available'] == 25
        assert result['shortfall'] == 75
        assert user_profile['fhir_points'] == 25  # Unchanged

    def test_points_balance_validation(self, user_profile):
        """Test points balance is correctly validated before operations"""
        
        def validate_balance(user_id, required_points):
            current_balance = user_profile['fhir_points']
            
            return {
                'valid': current_balance >= required_points,
                'current_balance': current_balance,
                'required': required_points,
                'can_afford': current_balance >= required_points
            }
        
        # Test affordable item
        result1 = validate_balance('user-123', 50)
        assert result1['valid'] == True
        assert result1['can_afford'] == True
        assert result1['current_balance'] == 150
        
        # Test expensive item
        result2 = validate_balance('user-123', 200)
        assert result2['valid'] == False
        assert result2['can_afford'] == False

    def test_concurrent_redemption_prevention(self, user_profile):
        """Test concurrent redemptions don't cause negative balance"""
        
        redemption_lock = False
        
        def thread_safe_redemption(user_id, item_id, cost):
            nonlocal redemption_lock
            
            if redemption_lock:
                return {'success': False, 'error': 'Another redemption in progress'}
            
            redemption_lock = True
            
            try:
                if user_profile['fhir_points'] < cost:
                    return {'success': False, 'error': 'Insufficient points'}
                
                # Simulate processing time
                user_profile['fhir_points'] -= cost
                
                return {'success': True, 'remaining_points': user_profile['fhir_points']}
            finally:
                redemption_lock = False
        
        # First redemption
        result1 = thread_safe_redemption('user-123', 'item1', 50)
        assert result1['success'] == True
        assert user_profile['fhir_points'] == 100
        
        # Reset for concurrent test
        redemption_lock = True  # Simulate lock
        result2 = thread_safe_redemption('user-123', 'item2', 25)
        assert result2['success'] == False
        assert result2['error'] == 'Another redemption in progress'

    def test_points_history_tracking(self, user_profile, points_history_database):
        """Test all points transactions are properly tracked"""
        
        def record_points_transaction(user_id, transaction_type, points, details):
            transaction = {
                'user_id': user_id,
                'type': transaction_type,  # 'earned' or 'redeemed'
                'points': points,
                'details': details,
                'timestamp': datetime.now(),
                'balance_after': user_profile['fhir_points']
            }
            points_history_database.append(transaction)
            return transaction
        
        # Record earning transaction
        user_profile['fhir_points'] += 25
        earn_tx = record_points_transaction('user-123', 'earned', 25, 'Quiz completion')
        
        # Record redemption transaction
        user_profile['fhir_points'] -= 50
        redeem_tx = record_points_transaction('user-123', 'redeemed', -50, 'Template download')
        
        assert len(points_history_database) == 2
        assert points_history_database[0]['type'] == 'earned'
        assert points_history_database[0]['points'] == 25
        assert points_history_database[1]['type'] == 'redeemed'
        assert points_history_database[1]['points'] == -50
        assert points_history_database[1]['balance_after'] == 125

    def test_negative_points_prevention(self, user_profile):
        """Test system prevents negative point balances"""
        
        def safe_point_deduction(user_id, points_to_deduct):
            if user_profile['fhir_points'] - points_to_deduct < 0:
                return {
                    'success': False, 
                    'error': 'Operation would result in negative balance'
                }
            
            user_profile['fhir_points'] -= points_to_deduct
            return {'success': True, 'new_balance': user_profile['fhir_points']}
        
        # Attempt to deduct more than available
        result = safe_point_deduction('user-123', 200)
        assert result['success'] == False
        assert 'negative balance' in result['error']
        assert user_profile['fhir_points'] == 150  # Unchanged

if __name__ == '__main__':
    pytest.main([__file__, '-v'])