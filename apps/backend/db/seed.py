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

class CommerceSeeder:
    def __init__(self, database_url: str, stripe_price_ids: Dict[str, str]):
        self.database_url = database_url
        self.stripe_price_ids = stripe_price_ids
        
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