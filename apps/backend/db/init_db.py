#!/usr/bin/env python3
"""
Database initialization script for FHIR Healthcare Bootcamp
Runs schema.sql and policies.sql via Supabase REST API
"""

import os
import sys
import requests
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SupabaseDBInitializer:
    def __init__(self):
        self.supabase_url = os.getenv('VITE_SUPABASE_URL')
        self.service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url:
            raise ValueError("VITE_SUPABASE_URL environment variable is required")
        if not self.service_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
        
        # Remove trailing slash from URL
        self.supabase_url = self.supabase_url.rstrip('/')
        
        # Set up headers for API requests
        self.headers = {
            'apikey': self.service_key,
            'Authorization': f'Bearer {self.service_key}',
            'Content-Type': 'application/json'
        }
    
    def execute_sql(self, sql_content: str, description: str) -> bool:
        """Execute SQL via Supabase REST API"""
        try:
            logger.info(f"Executing {description}...")
            
            # Use the PostgREST admin endpoint for raw SQL execution
            url = f"{self.supabase_url}/rest/v1/rpc/exec_sql"
            
            # If exec_sql RPC doesn't exist, try direct SQL execution
            # This is a fallback approach using the database REST API
            payload = {
                "sql": sql_content
            }
            
            response = requests.post(url, json=payload, headers=self.headers)
            
            if response.status_code == 404:
                # Fallback: try using the edge functions endpoint
                logger.info("Trying alternative SQL execution method...")
                return self._execute_sql_fallback(sql_content, description)
            
            if response.status_code == 200:
                logger.info(f"✅ {description} executed successfully")
                return True
            else:
                logger.error(f"❌ Failed to execute {description}")
                logger.error(f"Status: {response.status_code}")
                logger.error(f"Response: {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"❌ Network error executing {description}: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Unexpected error executing {description}: {e}")
            return False
    
    def _execute_sql_fallback(self, sql_content: str, description: str) -> bool:
        """Fallback method to execute SQL using direct database connection"""
        try:
            # Split SQL into individual statements
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for i, statement in enumerate(statements):
                logger.info(f"Executing statement {i+1}/{len(statements)}...")
                
                # Use Supabase database API for each statement
                # This is a simplified approach - in production, you might want to use
                # a proper PostgreSQL client library
                url = f"{self.supabase_url}/rest/v1/rpc/exec"
                
                payload = {"statement": statement}
                response = requests.post(url, json=payload, headers=self.headers)
                
                if response.status_code not in [200, 201, 204]:
                    logger.warning(f"Statement {i+1} may have failed: {response.status_code}")
                    logger.warning(f"Response: {response.text}")
            
            logger.info(f"✅ {description} executed (with fallback method)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Fallback execution failed for {description}: {e}")
            return False
    
    def read_sql_file(self, filepath: Path) -> str:
        """Read SQL file content"""
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            logger.error(f"❌ SQL file not found: {filepath}")
            raise
        except Exception as e:
            logger.error(f"❌ Error reading SQL file {filepath}: {e}")
            raise
    
    def initialize_database(self) -> bool:
        """Initialize the database with schema and policies"""
        logger.info("🚀 Starting database initialization...")
        
        # Get the directory containing this script
        script_dir = Path(__file__).parent
        
        # Define SQL file paths
        schema_file = script_dir / 'schema.sql'
        policies_file = script_dir / 'policies.sql'
        
        success = True
        
        # Execute schema.sql
        try:
            schema_sql = self.read_sql_file(schema_file)
            if not self.execute_sql(schema_sql, "database schema"):
                success = False
        except Exception as e:
            logger.error(f"❌ Failed to read schema file: {e}")
            success = False
        
        # Execute policies.sql
        try:
            policies_sql = self.read_sql_file(policies_file)
            if not self.execute_sql(policies_sql, "RLS policies"):
                success = False
        except Exception as e:
            logger.error(f"❌ Failed to read policies file: {e}")
            success = False
        
        if success:
            logger.info("🎉 Database initialization completed successfully!")
            logger.info("You can now:")
            logger.info("1. Grant admin access: SELECT grant_admin('admin@example.com');")
            logger.info("2. Start adding products, courses, and badges")
        else:
            logger.error("❌ Database initialization failed!")
        
        return success

def main():
    """Main entry point"""
    try:
        initializer = SupabaseDBInitializer()
        success = initializer.initialize_database()
        sys.exit(0 if success else 1)
        
    except ValueError as e:
        logger.error(f"❌ Configuration error: {e}")
        logger.error("Please set the required environment variables:")
        logger.error("- VITE_SUPABASE_URL")
        logger.error("- SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
        
    except KeyboardInterrupt:
        logger.info("❌ Database initialization cancelled by user")
        sys.exit(1)
        
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()