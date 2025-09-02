#!/usr/bin/env python3
"""
FHIR Healthcare Bootcamp Commerce Data Seeder

Seeds the database with demo products, courses, and badges for the bootcamp platform.
This script populates essential commerce data needed for course access control and gamification.
"""

import os
import json
import asyncio
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncpg
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class Product:
    sku: str
    name: str
    description: str
    active: bool = True
    metadata: Dict[str, Any] = None

@dataclass
class Price:
    product_sku: str
    stripe_price_id: str
    currency: str
    unit_amount: int
    interval: Optional[str] = None

@dataclass
class Course:
    slug: str
    title: str
    summary: str
    requires_product_sku: Optional[str] = None
    is_free: bool = False

@dataclass
class Badge:
    code: str
    name: str
    description: str
    points: int = 0

@dataclass
class DemoUser:
    id: str
    email: str
    full_name: str
    role: str
    fhir_points: int = 0
    avatar_url: str = None

@dataclass
class DemoPurchase:
    user_id: str
    product_sku: str
    status: str
    trial_ends_at: Optional[datetime] = None
    stripe_subscription_id: str = None

@dataclass
class DemoEnrollment:
    user_id: str
    course_slug: str
    progress: Dict[str, Any]
    completed: bool = False
    certificate_url: str = None
    badge_ids: list = None

@dataclass
class DemoAward:
    user_id: str
    badge_code: str
    course_slug: str = None

@dataclass
class Testimonial:
    name: str
    role: str
    content: str
    rating: int = 5
    featured: bool = False
    image_url: str = None

class CommerceSeeder:
    def __init__(self, database_url: str, stripe_price_ids: Dict[str, str]):
        self.database_url = database_url
        self.stripe_price_ids = stripe_price_ids
        self.demo_user_ids = {}  # Store demo user IDs for reference
        
    async def connect(self):
        """Connect to the PostgreSQL database"""
        self.conn = await asyncpg.connect(self.database_url)
        logger.info("Connected to database")
    
    async def disconnect(self):
        """Disconnect from the database"""
        if hasattr(self, 'conn'):
            await self.conn.close()
            logger.info("Disconnected from database")
    
    async def seed_products(self):
        """Seed demo products"""
        products = [
            Product(
                sku='bootcamp_basic',
                name='FHIR Bootcamp - Basic Access',
                description='3-day hands-on FHIR healthcare interoperability bootcamp with basic lab access and community support.',
                metadata={
                    'features': ['3-day lab access', 'Community support', 'Certificate of completion'],
                    'duration_days': 3,
                    'skill_level': 'beginner'
                }
            ),
            Product(
                sku='bootcamp_plus',
                name='FHIR Bootcamp - Plus Access',
                description='Premium FHIR bootcamp experience with extended lab access, 1-on-1 mentoring, and advanced deep-dive modules.',
                metadata={
                    'features': ['Extended lab access', '1-on-1 mentoring', 'Advanced modules', 'Priority support', 'Premium certificate'],
                    'duration_days': 5,
                    'skill_level': 'intermediate',
                    'mentoring_hours': 2
                }
            ),
            Product(
                sku='course_fhir101',
                name='FHIR 101 - Fundamentals Course',
                description='Comprehensive introduction to FHIR standards, resources, and implementation patterns for healthcare developers.',
                metadata={
                    'features': ['Self-paced learning', 'Interactive quizzes', 'Resource library', 'Basic certification'],
                    'estimated_hours': 8,
                    'skill_level': 'beginner',
                    'module_count': 12
                }
            )
        ]
        
        for product in products:
            await self.conn.execute('''
                INSERT INTO products (sku, name, description, active, metadata)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (sku) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    active = EXCLUDED.active,
                    metadata = EXCLUDED.metadata
            ''', product.sku, product.name, product.description, product.active, json.dumps(product.metadata or {}))
            
        logger.info(f"Seeded {len(products)} products")
    
    async def seed_prices(self):
        """Seed Stripe prices for products"""
        prices = [
            Price(
                product_sku='bootcamp_basic',
                stripe_price_id=self.stripe_price_ids.get('bootcamp_basic', 'price_demo_basic'),
                currency='usd',
                unit_amount=29900,  # $299.00
                interval=None  # One-time purchase
            ),
            Price(
                product_sku='bootcamp_plus',
                stripe_price_id=self.stripe_price_ids.get('bootcamp_plus', 'price_demo_plus'),
                currency='usd',
                unit_amount=59900,  # $599.00
                interval=None  # One-time purchase
            ),
            Price(
                product_sku='course_fhir101',
                stripe_price_id=self.stripe_price_ids.get('course_fhir101', 'price_demo_fhir101'),
                currency='usd',
                unit_amount=9900,   # $99.00
                interval=None  # One-time purchase
            )
        ]
        
        for price in prices:
            await self.conn.execute('''
                INSERT INTO prices (product_sku, stripe_price_id, currency, unit_amount, interval)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (stripe_price_id) DO UPDATE SET
                    product_sku = EXCLUDED.product_sku,
                    currency = EXCLUDED.currency,
                    unit_amount = EXCLUDED.unit_amount,
                    interval = EXCLUDED.interval
            ''', price.product_sku, price.stripe_price_id, price.currency, price.unit_amount, price.interval)
            
        logger.info(f"Seeded {len(prices)} prices")
    
    async def seed_courses(self):
        """Seed courses with access requirements"""
        courses = [
            Course(
                slug='fhir-101',
                title='FHIR 101: Healthcare Interoperability Fundamentals',
                summary='Learn the basics of FHIR (Fast Healthcare Interoperability Resources) standard, including resource types, RESTful APIs, and implementation patterns.',
                requires_product_sku=None,  # Free course
                is_free=True
            ),
            Course(
                slug='health-data-bootcamp',
                title='3-Day Health Data Bootcamp: Ingest, Transform & Operationalize',
                summary='Hands-on intensive bootcamp covering the complete health data lifecycle from ingestion to operationalization using FHIR standards.',
                requires_product_sku='bootcamp_basic',
                is_free=False
            ),
            Course(
                slug='fhir-deep-dive',
                title='FHIR Deep Dive: Advanced Implementation & Architecture',
                summary='Advanced course covering complex FHIR implementations, custom extensions, terminology services, and enterprise architecture patterns.',
                requires_product_sku='bootcamp_plus',
                is_free=False
            )
        ]
        
        for course in courses:
            await self.conn.execute('''
                INSERT INTO courses (slug, title, summary, requires_product_sku, is_free)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (slug) DO UPDATE SET
                    title = EXCLUDED.title,
                    summary = EXCLUDED.summary,
                    requires_product_sku = EXCLUDED.requires_product_sku,
                    is_free = EXCLUDED.is_free
            ''', course.slug, course.title, course.summary, course.requires_product_sku, course.is_free)
            
        logger.info(f"Seeded {len(courses)} courses")
    
    async def seed_badges(self):
        """Seed achievement badges"""
        badges = [
            Badge(
                code='BYOD_CHAMP',
                name='BYOD Champion',
                description='Successfully completed Bring Your Own Data challenge by uploading and processing custom healthcare datasets through the FHIR pipeline.',
                points=50
            ),
            Badge(
                code='FHIR_LOOP_CLOSER',
                name='FHIR Loop Closer',
                description='Mastered the complete FHIR data lifecycle by successfully ingesting, transforming, and operationalizing health data with published observations.',
                points=75
            ),
            Badge(
                code='QUIZ_MASTER',
                name='Quiz Master',
                description='Demonstrated comprehensive FHIR knowledge by achieving high scores across all bootcamp quizzes and assessments.',
                points=25
            )
        ]
        
        for badge in badges:
            await self.conn.execute('''
                INSERT INTO badges (code, name, description, points)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    points = EXCLUDED.points
            ''', badge.code, badge.name, badge.description, badge.points)
            
        logger.info(f"Seeded {len(badges)} badges")
    
    async def seed_demo_users(self):
        """Seed demo instructor and student accounts"""
        demo_users = [
            DemoUser(
                id=str(uuid.uuid4()),
                email='instructor.demo@fhirbootcamp.com',
                full_name='Dr. Sarah Chen',
                role='instructor',
                fhir_points=500,
                avatar_url='https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            ),
            DemoUser(
                id=str(uuid.uuid4()),
                email='student1.demo@fhirbootcamp.com',
                full_name='Alex Rivera',
                role='student',
                fhir_points=250,
                avatar_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            ),
            DemoUser(
                id=str(uuid.uuid4()),
                email='student2.demo@fhirbootcamp.com',
                full_name='Jamie Kim',
                role='student',
                fhir_points=180,
                avatar_url='https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
            ),
            DemoUser(
                id=str(uuid.uuid4()),
                email='student3.demo@fhirbootcamp.com',
                full_name='Marcus Thompson',
                role='student',
                fhir_points=320,
                avatar_url='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            )
        ]
        
        # First insert into auth.users (simulated)
        for user in demo_users:
            self.demo_user_ids[user.email] = user.id
            # Insert into profiles table
            await self.conn.execute('''
                INSERT INTO profiles (id, email, full_name, avatar_url, role, fhir_points)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    full_name = EXCLUDED.full_name,
                    avatar_url = EXCLUDED.avatar_url,
                    role = EXCLUDED.role,
                    fhir_points = EXCLUDED.fhir_points
            ''', user.id, user.email, user.full_name, user.avatar_url, user.role, user.fhir_points)
            
        logger.info(f"Seeded {len(demo_users)} demo users")
    
    async def seed_demo_purchases(self):
        """Seed demo purchases and trials"""
        now = datetime.now()
        demo_purchases = [
            # Active purchase for student1
            DemoPurchase(
                user_id=self.demo_user_ids['student1.demo@fhirbootcamp.com'],
                product_sku='bootcamp_basic',
                status='active',
                stripe_subscription_id='sub_demo_basic_123'
            ),
            # Trial for student2 (expires in 5 days)
            DemoPurchase(
                user_id=self.demo_user_ids['student2.demo@fhirbootcamp.com'],
                product_sku='bootcamp_plus',
                status='trialing',
                trial_ends_at=now + timedelta(days=5),
                stripe_subscription_id='sub_demo_trial_456'
            ),
            # Active Plus purchase for student3
            DemoPurchase(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                product_sku='bootcamp_plus',
                status='active',
                stripe_subscription_id='sub_demo_plus_789'
            )
        ]
        
        for purchase in demo_purchases:
            await self.conn.execute('''
                INSERT INTO purchases (user_id, product_sku, stripe_subscription_id, status, trial_ends_at)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING
            ''', purchase.user_id, purchase.product_sku, purchase.stripe_subscription_id, purchase.status, purchase.trial_ends_at)
            
        logger.info(f"Seeded {len(demo_purchases)} demo purchases")
    
    async def seed_demo_enrollments(self):
        """Seed demo course enrollments with progress"""
        demo_enrollments = [
            # Student1 - completed FHIR 101, in progress on bootcamp
            DemoEnrollment(
                user_id=self.demo_user_ids['student1.demo@fhirbootcamp.com'],
                course_slug='fhir-101',
                progress={'completed_modules': 12, 'quiz_score': 95, 'completion_rate': 100},
                completed=True,
                certificate_url='/certificates/demo_student1_fhir101.pdf',
                badge_ids=['QUIZ_MASTER']
            ),
            DemoEnrollment(
                user_id=self.demo_user_ids['student1.demo@fhirbootcamp.com'],
                course_slug='health-data-bootcamp',
                progress={'completed_days': 2, 'labs_completed': 8, 'current_step': 'day3_lab1'},
                completed=False
            ),
            # Student2 - trial user, some progress
            DemoEnrollment(
                user_id=self.demo_user_ids['student2.demo@fhirbootcamp.com'],
                course_slug='fhir-101',
                progress={'completed_modules': 8, 'quiz_score': 78, 'completion_rate': 67},
                completed=False
            ),
            # Student3 - advanced user with multiple completions
            DemoEnrollment(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                course_slug='fhir-101',
                progress={'completed_modules': 12, 'quiz_score': 98, 'completion_rate': 100},
                completed=True,
                certificate_url='/certificates/demo_student3_fhir101.pdf',
                badge_ids=['QUIZ_MASTER']
            ),
            DemoEnrollment(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                course_slug='health-data-bootcamp',
                progress={'completed_days': 3, 'labs_completed': 12, 'byod_completed': True},
                completed=True,
                certificate_url='/certificates/demo_student3_bootcamp.pdf',
                badge_ids=['FHIR_LOOP_CLOSER', 'BYOD_CHAMP']
            ),
            DemoEnrollment(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                course_slug='fhir-deep-dive',
                progress={'completed_modules': 6, 'advanced_labs': 4, 'completion_rate': 75},
                completed=False
            )
        ]
        
        for enrollment in demo_enrollments:
            await self.conn.execute('''
                INSERT INTO enrollments (user_id, course_slug, progress, completed, certificate_url, badge_ids)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, course_slug) DO UPDATE SET
                    progress = EXCLUDED.progress,
                    completed = EXCLUDED.completed,
                    certificate_url = EXCLUDED.certificate_url,
                    badge_ids = EXCLUDED.badge_ids
            ''', enrollment.user_id, enrollment.course_slug, json.dumps(enrollment.progress), 
                 enrollment.completed, enrollment.certificate_url, enrollment.badge_ids or [])
            
        logger.info(f"Seeded {len(demo_enrollments)} demo enrollments")
    
    async def seed_demo_awards(self):
        """Seed demo badge awards"""
        demo_awards = [
            DemoAward(
                user_id=self.demo_user_ids['student1.demo@fhirbootcamp.com'],
                badge_code='QUIZ_MASTER',
                course_slug='fhir-101'
            ),
            DemoAward(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                badge_code='QUIZ_MASTER',
                course_slug='fhir-101'
            ),
            DemoAward(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                badge_code='FHIR_LOOP_CLOSER',
                course_slug='health-data-bootcamp'
            ),
            DemoAward(
                user_id=self.demo_user_ids['student3.demo@fhirbootcamp.com'],
                badge_code='BYOD_CHAMP',
                course_slug='health-data-bootcamp'
            )
        ]
        
        for award in demo_awards:
            await self.conn.execute('''
                INSERT INTO awards (user_id, badge_code, course_slug)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, badge_code) DO UPDATE SET
                    course_slug = EXCLUDED.course_slug
            ''', award.user_id, award.badge_code, award.course_slug)
            
        logger.info(f"Seeded {len(demo_awards)} demo badge awards")
    
    async def seed_testimonials(self):
        """Seed customer testimonials"""
        testimonials = [
            Testimonial(
                name='Dr. Sarah Chen',
                role='Healthcare IT Director',
                content='This bootcamp completely transformed how I approach healthcare data integration. The hands-on labs with real FHIR data gave me confidence to implement these solutions in our hospital system.',
                rating=5,
                featured=True,
                image_url='https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
            ),
            Testimonial(
                name='Alex Rivera',
                role='Senior Software Engineer',
                content='I went from knowing nothing about FHIR to building production-ready healthcare APIs in just 3 days. The curriculum is perfectly structured and the instructors are phenomenal.',
                rating=5,
                featured=True,
                image_url='https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
            ),
            Testimonial(
                name='Marcus Thompson',
                role='Health Data Analyst',
                content='The BYOD workshop was a game-changer. Being able to work with our own hospital data and see immediate results made everything click. Now I\'m the go-to person for FHIR projects at work.',
                rating=5,
                featured=True,
                image_url='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            )
        ]
        
        for testimonial in testimonials:
            await self.conn.execute('''
                INSERT INTO testimonials (name, role, content, rating, featured, image_url)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO NOTHING
            ''', testimonial.name, testimonial.role, testimonial.content, testimonial.rating, testimonial.featured, testimonial.image_url)
            
        logger.info(f"Seeded {len(testimonials)} testimonials")
    
    async def seed_demo_data(self):
        """Seed all demo data including users, purchases, progress, and testimonials"""
        logger.warning("🚨 CAUTION: Seeding demo data including fake user accounts and purchases")
        logger.warning("🚨 This should only be used in development/demo environments")
        
        try:
            await self.connect()
            
            logger.info("Starting demo data seeding...")
            await self.seed_demo_users()
            await self.seed_demo_purchases()
            await self.seed_demo_enrollments()
            await self.seed_demo_awards()
            await self.seed_testimonials()
            
            logger.info("✅ Demo data seeding completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Demo seeding failed: {e}")
            raise
        finally:
            await self.disconnect()
    
    async def seed_all(self):
        """Run all seeding operations"""
        try:
            await self.connect()
            
            logger.info("Starting commerce data seeding...")
            await self.seed_products()
            await self.seed_prices()
            await self.seed_courses()
            await self.seed_badges()
            
            logger.info("✅ Commerce seeding completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Seeding failed: {e}")
            raise
        finally:
            await self.disconnect()

async def main():
    """Main entry point for the seeder"""
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is required")
    
    # Get Stripe price IDs from environment JSON
    stripe_price_ids_json = os.getenv('STRIPE_PRICE_IDS_JSON', '{}')
    try:
        stripe_price_ids = json.loads(stripe_price_ids_json)
    except json.JSONDecodeError:
        logger.warning("STRIPE_PRICE_IDS_JSON is not valid JSON, using demo prices")
        stripe_price_ids = {}
    
    # Create and run seeder
    seeder = CommerceSeeder(database_url, stripe_price_ids)
    await seeder.seed_all()

if __name__ == "__main__":
    asyncio.run(main())