"""
Supabase Configuration for ML Service
Handles connection to Supabase database
"""

import os
import logging
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """
    Get Supabase client instance
    """
    try:
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError(
                "Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
            )
        
        # Create client
        client = create_client(supabase_url, supabase_key)
        
        # Test connection
        try:
            # Simple test query
            response = client.table('tide_data').select('count', count='exact').limit(1).execute()
            logger.info("✅ Supabase connection successful")
        except Exception as e:
            logger.warning(f"⚠️  Supabase connection test failed: {e}")
            logger.info("This might be normal if the tide_data table doesn't exist yet")
        
        return client
        
    except Exception as e:
        logger.error(f"❌ Failed to create Supabase client: {e}")
        raise

def test_supabase_connection() -> bool:
    """
    Test Supabase connection and return True if successful
    """
    try:
        client = get_supabase_client()
        
        # Test with a simple query
        response = client.table('tide_data').select('count', count='exact').limit(1).execute()
        
        logger.info("✅ Supabase connection test passed")
        return True
        
    except Exception as e:
        logger.error(f"❌ Supabase connection test failed: {e}")
        return False

def get_tide_data_sample(limit: int = 5) -> Optional[list]:
    """
    Get a sample of tide data to verify connection
    """
    try:
        client = get_supabase_client()
        
        response = client.table('tide_data').select('*').limit(limit).execute()
        
        if response.data:
            logger.info(f"✅ Retrieved {len(response.data)} sample records")
            return response.data
        else:
            logger.warning("⚠️  No data found in tide_data table")
            return None
            
    except Exception as e:
        logger.error(f"❌ Failed to retrieve sample data: {e}")
        return None

if __name__ == "__main__":
    # Test the configuration
    print("🧪 Testing Supabase Configuration...")
    
    try:
        client = get_supabase_client()
        print("✅ Supabase client created successfully")
        
        # Test connection
        if test_supabase_connection():
            print("✅ Connection test passed")
            
            # Get sample data
            sample = get_tide_data_sample(3)
            if sample:
                print(f"✅ Sample data retrieved: {len(sample)} records")
                print(f"📊 Sample record: {sample[0] if sample else 'None'}")
            else:
                print("⚠️  No sample data available")
        else:
            print("❌ Connection test failed")
            
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
