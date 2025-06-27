#!/usr/bin/env python3
"""
Database initialization script for SOS Nairobi
Creates MongoDB collections, indexes, and sample data
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import uuid
import pymongo

# Add the parent directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from services.config import settings
from models.database_models import MONGODB_INDEXES, REDIS_CONFIG
from models.schemas import Coordinates, NewHelpRequest, Volunteer, Resource, Update

async def init_mongodb():
    """Initialize MongoDB collections and indexes"""
    print("🔧 Initializing MongoDB...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE_NAME]
    
    try:
        # Test connection
        await client.admin.command('ismaster')
        print(f"✅ Connected to MongoDB: {settings.MONGODB_DATABASE_NAME}")
        
        # Create collections and indexes
        for collection_name, indexes in MONGODB_INDEXES.items():
            print(f"📋 Setting up collection: {collection_name}")
            
            # Create collection if it doesn't exist
            if collection_name not in await db.list_collection_names():
                await db.create_collection(collection_name)
                print(f"   ✅ Created collection: {collection_name}")
            
            # Create indexes
            collection = db[collection_name]
            for index_config in indexes:
                try:
                    await collection.create_index(
                        index_config["keys"],
                        name=index_config["name"],
                        unique=index_config.get("unique", False),
                        sparse=index_config.get("sparse", False)
                    )
                    print(f"   ✅ Created index: {index_config['name']}")
                except Exception as e:
                    print(f"   ⚠️  Index {index_config['name']} already exists or error: {e}")
        
        # Populate with sample data
        await populate_sample_data(db)
        
    except Exception as e:
        print(f"❌ MongoDB initialization failed: {e}")
        raise
    finally:
        client.close()

async def populate_sample_data(db):
    """Populate database with sample data for testing"""
    print("📝 Populating sample data...")
    
    # Sample volunteers
    volunteers_data = [
        {
            "volunteer_id": str(uuid.uuid4()),
            "name": "Dr. Sarah Mwangi",
            "phone_number": "+254700123456",
            "skills": ["Medical"],
            "verification_code": "MED001",
            "is_verified": True,
            "status": "available",
            "last_seen": datetime.utcnow(),
            "current_location": {
                "lat": -1.2921,
                "lng": 36.8219
            }
        },
        {
            "volunteer_id": str(uuid.uuid4()),
            "name": "Advocate John Kamau",
            "phone_number": "+254700123457",
            "skills": ["Legal"],
            "verification_code": "LEG001",
            "is_verified": True,
            "status": "available",
            "last_seen": datetime.utcnow(),
            "current_location": {
                "lat": -1.2841,
                "lng": 36.8155
            }
        },
        {
            "volunteer_id": str(uuid.uuid4()),
            "name": "Community Helper Mary Wanjiku",
            "phone_number": "+254700123458",
            "skills": ["Shelter"],
            "verification_code": "SHEL001",
            "is_verified": True,
            "status": "available",
            "last_seen": datetime.utcnow(),
            "current_location": {
                "lat": -1.2864,
                "lng": 36.8172
            }
        }
    ]
    
    # Sample help requests
    help_requests_data = [
        {
            "request_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "source": "direct_app",
            "request_type": "Medical",
            "location_text": "Nairobi CBD, near Kenyatta Avenue",
            "coordinates": {
                "lat": -1.2921,
                "lng": 36.8219
            },
            "original_content": "Need medical assistance for minor injury",
            "status": "pending"
        },
        {
            "request_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow() - timedelta(minutes=15),
            "source": "direct_app",
            "request_type": "Legal",
            "location_text": "Westlands, near Sarit Centre",
            "coordinates": {
                "lat": -1.2841,
                "lng": 36.8155
            },
            "original_content": "Need legal advice regarding rights during protests",
            "status": "pending"
        }
    ]
    
    # Sample resources
    resources_data = [
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Basic First Aid Guide",
            "content": "Essential first aid procedures for common injuries...",
            "category": "Medical Aid",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Know Your Rights",
            "content": "Legal rights and procedures during civil demonstrations...",
            "category": "Legal Advice",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Safe Zones in Nairobi",
            "content": "List of designated safe zones and emergency shelters...",
            "category": "Shelter Locations",
            "last_updated": datetime.utcnow()
        }
    ]
    
    # Sample updates
    updates_data = [
        {
            "update_id": str(uuid.uuid4()),
            "title": "Road Closures Update",
            "summary": "Several roads in CBD are currently closed",
            "full_content": "Moi Avenue, Kenyatta Avenue, and parts of Uhuru Highway are closed due to ongoing demonstrations.",
            "timestamp": datetime.utcnow() - timedelta(hours=1),
            "source": "Official"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Medical Teams Deployed",
            "summary": "Additional medical teams have been deployed to CBD",
            "full_content": "Red Cross and St. John Ambulance teams are now stationed at key locations in the city center.",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "source": "Community Report"
        }
    ]
    
    # Insert sample data
    collections_data = {
        "volunteers": volunteers_data,
        "help_requests": help_requests_data,
        "resources": resources_data,
        "updates": updates_data
    }
    
    for collection_name, data in collections_data.items():
        if data:
            # Check if collection is empty
            count = await db[collection_name].count_documents({})
            if count == 0:
                result = await db[collection_name].insert_many(data)
                print(f"   ✅ Inserted {len(result.inserted_ids)} documents into {collection_name}")
            else:
                print(f"   ⚠️  Collection {collection_name} already has data ({count} documents)")

async def init_redis():
    """Initialize Redis with sample data"""
    print("🔧 Initializing Redis...")
    
    try:
        # Connect to Redis
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            username=settings.REDIS_USERNAME,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )
        
        # Test connection
        await redis_client.ping()
        print(f"✅ Connected to Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        
        # Set up sample Redis data
        sample_data = {
            "requests:active": "5",
            "map:hotspots": "3",
            "system:status": "operational",
            "last_update": datetime.utcnow().isoformat()
        }
        
        for key, value in sample_data.items():
            await redis_client.set(key, value, ex=REDIS_CONFIG["ttl"]["active_requests"])
            print(f"   ✅ Set Redis key: {key}")
        
        # Test pub/sub
        pubsub = redis_client.pubsub()
        await pubsub.subscribe("test_channel")
        await redis_client.publish("test_channel", "test_message")
        await pubsub.unsubscribe("test_channel")
        await pubsub.close()
        print("   ✅ Redis pub/sub test successful")
        
    except Exception as e:
        print(f"❌ Redis initialization failed: {e}")
        raise
    finally:
        await redis_client.close()

async def main():
    """Main initialization function"""
    print("🚀 Starting SOS Nairobi Database Initialization...")
    print("=" * 50)
    
    try:
        # Initialize MongoDB
        await init_mongodb()
        print()
        
        # Initialize Redis
        await init_redis()
        print()
        
        print("✅ Database initialization completed successfully!")
        print("=" * 50)
        print("📊 Summary:")
        print("   • MongoDB collections and indexes created")
        print("   • Sample data populated")
        print("   • Redis configured and tested")
        print()
        print("🔗 Connection Details:")
        print(f"   • MongoDB: {settings.MONGODB_URI}")
        print(f"   • Database: {settings.MONGODB_DATABASE_NAME}")
        print(f"   • Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        print()
        print("🎯 Ready for testing!")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["nairobi_aid_connect"]
zones = db["zones"]

dummy_zones = [
    {"name": "CBD", "lat": -1.2921, "lng": 36.8219, "status": "danger", "intensity": 0.8},
    {"name": "Westlands", "lat": -1.2676, "lng": 36.8062, "status": "moderate", "intensity": 0.6},
    {"name": "Kibera", "lat": -1.3133, "lng": 36.7892, "status": "calm", "intensity": 0.3},
    {"name": "Parklands", "lat": -1.2632, "lng": 36.8103, "status": "moderate", "intensity": 0.5},
    {"name": "Industrial Area", "lat": -1.3031, "lng": 36.8073, "status": "danger", "intensity": 0.9},
    {"name": "Gigiri", "lat": -1.2507, "lng": 36.8673, "status": "calm", "intensity": 0.2},
    {"name": "Karen", "lat": -1.2741, "lng": 36.7540, "status": "moderate", "intensity": 0.4},
    {"name": "Muthaiga", "lat": -1.2195, "lng": 36.8965, "status": "calm", "intensity": 0.1},
    {"name": "South B", "lat": -1.3152, "lng": 36.8302, "status": "danger", "intensity": 0.7},
    {"name": "Hurlingham", "lat": -1.2841, "lng": 36.8155, "status": "moderate", "intensity": 0.5},
]

zones.delete_many({})  # Clear old data
zones.insert_many(dummy_zones)
print("Dummy zones inserted.") 