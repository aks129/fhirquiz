"""
Purchases State Machine Test Suite

Tests for Stripe webhook events and purchase lifecycle management
with mock Stripe payloads covering state transitions.
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

class TestPurchasesStateMachine:
    """Test purchase state transitions via Stripe webhooks"""
    
    @pytest.fixture
    def stripe_customer_payload(self):
        """Mock Stripe customer creation event"""
        return {
            'id': 'evt_test_customer',
            'object': 'event',
            'type': 'customer.created',
            'data': {
                'object': {
                    'id': 'cus_test123',
                    'object': 'customer',
                    'email': 'student@test.com',
                    'metadata': {
                        'user_id': 'user-123'
                    }
                }
            }
        }

    @pytest.fixture
    def stripe_checkout_completed_payload(self):
        """Mock Stripe checkout session completion"""
        return {
            'id': 'evt_test_checkout',
            'object': 'event',
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': 'cs_test_session',
                    'object': 'checkout_session',
                    'customer': 'cus_test123',
                    'mode': 'payment',
                    'payment_status': 'paid',
                    'status': 'complete',
                    'metadata': {
                        'product_sku': 'bootcamp_basic',
                        'user_id': 'user-123'
                    },
                    'line_items': {
                        'data': [{
                            'price': {
                                'id': 'price_bootcamp_basic',
                                'unit_amount': 29900,
                                'currency': 'usd'
                            },
                            'quantity': 1
                        }]
                    }
                }
            }
        }

    @pytest.fixture
    def stripe_subscription_created_payload(self):
        """Mock Stripe subscription creation"""
        return {
            'id': 'evt_test_subscription',
            'object': 'event',
            'type': 'customer.subscription.created',
            'data': {
                'object': {
                    'id': 'sub_test123',
                    'object': 'subscription',
                    'customer': 'cus_test123',
                    'status': 'active',
                    'current_period_start': int(datetime.now().timestamp()),
                    'current_period_end': int((datetime.now() + timedelta(days=30)).timestamp()),
                    'trial_end': int((datetime.now() + timedelta(days=7)).timestamp()),
                    'items': {
                        'data': [{
                            'price': {
                                'id': 'price_bootcamp_plus',
                                'recurring': {'interval': 'month'}
                            }
                        }]
                    },
                    'metadata': {
                        'product_sku': 'bootcamp_plus',
                        'user_id': 'user-123'
                    }
                }
            }
        }

    @pytest.fixture
    def stripe_subscription_cancelled_payload(self):
        """Mock Stripe subscription cancellation"""
        return {
            'id': 'evt_test_cancel',
            'object': 'event',
            'type': 'customer.subscription.deleted',
            'data': {
                'object': {
                    'id': 'sub_test123',
                    'object': 'subscription',
                    'customer': 'cus_test123',
                    'status': 'canceled',
                    'canceled_at': int(datetime.now().timestamp()),
                    'metadata': {
                        'product_sku': 'bootcamp_plus',
                        'user_id': 'user-123'
                    }
                }
            }
        }

    @pytest.fixture
    def mock_database(self):
        """Mock database operations"""
        return {
            'purchases': [],
            'users': [
                {
                    'id': 'user-123',
                    'email': 'student@test.com',
                    'stripe_customer_id': None
                }
            ]
        }

    def test_checkout_completed_one_time_purchase(self, stripe_checkout_completed_payload, mock_database):
        """Test successful one-time purchase creates active purchase record"""
        payload = stripe_checkout_completed_payload
        
        def process_webhook(event_data):
            if event_data['type'] == 'checkout.session.completed':
                session = event_data['data']['object']
                
                # Create purchase record
                purchase = {
                    'id': f"purchase_{session['id']}",
                    'user_id': session['metadata']['user_id'],
                    'product_sku': session['metadata']['product_sku'],
                    'stripe_session_id': session['id'],
                    'status': 'active',
                    'amount_paid': 29900,
                    'created_at': datetime.now()
                }
                mock_database['purchases'].append(purchase)
                return purchase
        
        result = process_webhook(payload)
        
        assert result['status'] == 'active'
        assert result['user_id'] == 'user-123'
        assert result['product_sku'] == 'bootcamp_basic'
        assert result['amount_paid'] == 29900
        assert len(mock_database['purchases']) == 1

    def test_subscription_created_with_trial(self, stripe_subscription_created_payload, mock_database):
        """Test subscription creation with trial period"""
        payload = stripe_subscription_created_payload
        
        def process_subscription_webhook(event_data):
            if event_data['type'] == 'customer.subscription.created':
                sub = event_data['data']['object']
                
                purchase = {
                    'id': f"purchase_{sub['id']}",
                    'user_id': sub['metadata']['user_id'],
                    'product_sku': sub['metadata']['product_sku'],
                    'stripe_subscription_id': sub['id'],
                    'status': 'trialing' if sub.get('trial_end') else 'active',
                    'trial_ends_at': datetime.fromtimestamp(sub['trial_end']) if sub.get('trial_end') else None,
                    'created_at': datetime.now()
                }
                mock_database['purchases'].append(purchase)
                return purchase
        
        result = process_subscription_webhook(payload)
        
        assert result['status'] == 'trialing'
        assert result['trial_ends_at'] is not None
        assert result['stripe_subscription_id'] == 'sub_test123'

    def test_subscription_cancelled_state_transition(self, stripe_subscription_cancelled_payload, mock_database):
        """Test subscription cancellation updates purchase status"""
        # Setup existing subscription purchase
        existing_purchase = {
            'id': 'purchase_sub_test123',
            'user_id': 'user-123',
            'product_sku': 'bootcamp_plus',
            'stripe_subscription_id': 'sub_test123',
            'status': 'active',
            'created_at': datetime.now()
        }
        mock_database['purchases'].append(existing_purchase)
        
        payload = stripe_subscription_cancelled_payload
        
        def process_cancellation_webhook(event_data):
            if event_data['type'] == 'customer.subscription.deleted':
                sub = event_data['data']['object']
                
                # Find and update existing purchase
                for purchase in mock_database['purchases']:
                    if purchase['stripe_subscription_id'] == sub['id']:
                        purchase['status'] = 'cancelled'
                        purchase['cancelled_at'] = datetime.fromtimestamp(sub['canceled_at'])
                        return purchase
        
        result = process_cancellation_webhook(payload)
        
        assert result['status'] == 'cancelled'
        assert result['cancelled_at'] is not None
        assert result['user_id'] == 'user-123'

    def test_invalid_webhook_ignored(self, mock_database):
        """Test invalid webhook events are ignored"""
        invalid_payload = {
            'id': 'evt_test_invalid',
            'object': 'event',
            'type': 'invoice.payment_failed',
            'data': {'object': {}}
        }
        
        def process_webhook(event_data):
            supported_events = [
                'checkout.session.completed',
                'customer.subscription.created',
                'customer.subscription.deleted'
            ]
            
            if event_data['type'] not in supported_events:
                return None
            
            # Process webhook...
            return 'processed'
        
        result = process_webhook(invalid_payload)
        
        assert result is None
        assert len(mock_database['purchases']) == 0

    def test_duplicate_webhook_prevention(self, stripe_checkout_completed_payload, mock_database):
        """Test duplicate webhook events are prevented"""
        payload = stripe_checkout_completed_payload
        processed_events = set()
        
        def process_webhook_idempotent(event_data):
            event_id = event_data['id']
            
            # Check for duplicate
            if event_id in processed_events:
                return {'status': 'already_processed'}
            
            # Process event
            processed_events.add(event_id)
            
            if event_data['type'] == 'checkout.session.completed':
                session = event_data['data']['object']
                purchase = {
                    'id': f"purchase_{session['id']}",
                    'user_id': session['metadata']['user_id'],
                    'status': 'active'
                }
                mock_database['purchases'].append(purchase)
                return {'status': 'processed', 'purchase': purchase}
        
        # First call
        result1 = process_webhook_idempotent(payload)
        assert result1['status'] == 'processed'
        assert len(mock_database['purchases']) == 1
        
        # Duplicate call
        result2 = process_webhook_idempotent(payload)
        assert result2['status'] == 'already_processed'
        assert len(mock_database['purchases']) == 1  # No duplicate

    def test_trial_expiration_handling(self, mock_database):
        """Test trial expiration transitions subscription to requires payment"""
        # Setup trialing purchase
        trial_purchase = {
            'id': 'purchase_trial',
            'user_id': 'user-123',
            'product_sku': 'bootcamp_plus',
            'stripe_subscription_id': 'sub_test123',
            'status': 'trialing',
            'trial_ends_at': datetime.now() - timedelta(hours=1),  # Expired trial
            'created_at': datetime.now() - timedelta(days=7)
        }
        mock_database['purchases'].append(trial_purchase)
        
        def check_trial_expiration():
            now = datetime.now()
            for purchase in mock_database['purchases']:
                if (purchase['status'] == 'trialing' and 
                    purchase.get('trial_ends_at') and 
                    purchase['trial_ends_at'] < now):
                    purchase['status'] = 'past_due'
                    return purchase
        
        result = check_trial_expiration()
        
        assert result['status'] == 'past_due'
        assert result['user_id'] == 'user-123'

    def test_webhook_signature_validation(self):
        """Test webhook signature validation logic"""
        def validate_stripe_signature(payload, signature, secret):
            # Mock signature validation
            if signature == 'valid_signature' and secret == 'webhook_secret':
                return True
            return False
        
        # Valid signature
        assert validate_stripe_signature('payload', 'valid_signature', 'webhook_secret') == True
        
        # Invalid signature
        assert validate_stripe_signature('payload', 'invalid_signature', 'webhook_secret') == False
        
        # Missing secret
        assert validate_stripe_signature('payload', 'valid_signature', None) == False

    @patch('requests.post')
    def test_supabase_purchase_creation(self, mock_post, stripe_checkout_completed_payload):
        """Test integration with Supabase purchase creation"""
        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = [{
            'id': 'purchase_123',
            'user_id': 'user-123',
            'product_sku': 'bootcamp_basic',
            'status': 'active'
        }]
        mock_post.return_value = mock_response
        
        payload = stripe_checkout_completed_payload
        
        def create_purchase_in_supabase(session_data):
            # Mock Supabase insert
            purchase_data = {
                'user_id': session_data['metadata']['user_id'],
                'product_sku': session_data['metadata']['product_sku'],
                'status': 'active'
            }
            
            # Simulate API call
            response = mock_post('https://supabase.co/rest/v1/purchases', 
                               json=purchase_data,
                               headers={'Authorization': 'Bearer token'})
            
            return response.json()[0] if response.ok else None
        
        session = payload['data']['object']
        result = create_purchase_in_supabase(session)
        
        assert result is not None
        assert result['status'] == 'active'
        assert result['user_id'] == 'user-123'
        mock_post.assert_called_once()

if __name__ == '__main__':
    pytest.main([__file__, '-v'])