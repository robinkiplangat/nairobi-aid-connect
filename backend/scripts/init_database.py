#!/usr/bin/env python3
"""
MongoDB Database Initialization Script
Sets up collections and indices for the Nairobi Aid Connect platform
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from services.config import settings


async def init_mongodb():
    """Initialize MongoDB collections and indexes"""
    print("🔧 Initializing MongoDB...")

    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DATABASE_NAME]

    try:
        await client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {settings.MONGODB_DATABASE_NAME}")

        collections_config = {
            "help_requests": [
                [("request_id", 1)],
                [("timestamp", 1)],
                [("status", 1)],
                [("coordinates", "2dsphere")]
            ],
            "volunteers": [
                [("volunteer_id", 1)],
                [("is_verified", 1)],
                [("status", 1)],
                [("skills", 1)],
                [("current_location", "2dsphere")],
                [("last_seen", 1)]
            ],
            "assignments": [
                [("assignment_id", 1)],
                [("request_id", 1)],
                [("volunteer_id", 1)],
                [("timestamp", 1)]
            ],
            "chat_sessions": [
                [("chat_room_id", 1)],
                [("assignment_id", 1)],
                [("created_at", 1)],
                [("expires_at", 1)]
            ],
            "resources": [
                [("resource_id", 1)],
                [("category", 1)],
                [("last_updated", 1)]
            ],
            "updates": [
                [("update_id", 1)],
                [("timestamp", 1)],
                [("source", 1)]
            ],
            "organizations": [
                [("organization_id", 1)],
                [("organization_type", 1)],
                [("is_verified", 1)],
                [("created_at", 1)]
            ],
            "organization_users": [
                [("user_id", 1)],
                [("email", 1)],
                [("organization_id", 1)],
                [("role", 1)],
                [("is_active", 1)]
            ],
            "api_keys": [
                [("api_key_id", 1)],
                [("organization_id", 1)],
                [("is_active", 1)]
            ],
            "zones": [],
            "demo_data": [],
            "records": [[("id", 1)]]
        }

        for collection_name, indexes in collections_config.items():
            print(f"📋 Setting up collection: {collection_name}")

            if collection_name not in await db.list_collection_names():
                await db.create_collection(collection_name)
                print(f"   ✅ Created collection: {collection_name}")

            collection = db[collection_name]
            for index_spec in indexes:
                try:
                    await collection.create_index(index_spec)
                    index_name = ", ".join([f"{k}({v})" for k, v in index_spec])
                    print(f"   ✓ Index created: {index_name}")
                except Exception as e:
                    print(f"   ⚠️  Index: {e}")

        await populate_sample_data(db)

    except Exception as e:
        print(f"❌ MongoDB initialization failed: {e}")
        raise
    finally:
        client.close()


async def populate_sample_data(db):
    """Populate database with sample data for testing"""
    print("\n📝 Populating sample data...")

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
                "type": "Point",
                "coordinates": [36.8219, -1.2921]
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
                "type": "Point",
                "coordinates": [36.8155, -1.2841]
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
                "type": "Point",
                "coordinates": [36.8172, -1.2864]
            }
        }
    ]

    help_requests_data = [
        {
            "request_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "source": "direct_app",
            "request_type": "Medical",
            "location_text": "Nairobi CBD, near Kenyatta Avenue",
            "coordinates": {
                "type": "Point",
                "coordinates": [36.8219, -1.2921]
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
                "type": "Point",
                "coordinates": [36.8155, -1.2841]
            },
            "original_content": "Need legal advice regarding rights during protests",
            "status": "pending"
        }
    ]

    resources_data = [
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Basic First Aid Guide",
            "content": "Essential first aid procedures for common injuries. Includes CPR instructions, wound care, and emergency response protocols.",
            "category": "Medical Aid",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Know Your Rights",
            "content": "Legal rights and procedures during civil demonstrations. Information about detention rights, legal representation, and constitutional protections.",
            "category": "Legal Advice",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Safe Zones in Nairobi",
            "content": "List of designated safe zones and emergency shelters throughout Nairobi including hospitals, police stations, and community centers.",
            "category": "Shelter Locations",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Medical Emergency Hotlines",
            "content": "Contact numbers for emergency medical services: Kenya Red Cross (0713-638-000), St. John Ambulance (0733-636-0000), Nairobi Hospital (4722 000).",
            "category": "Medical Aid",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Mental Health Support",
            "content": "Mental health resources and counseling services available in Nairobi. Including crisis hotlines and support centers for trauma and stress management.",
            "category": "Health Services",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Women's Safety Resources",
            "content": "Information on women's safety during emergencies, harassment reporting, and support services for gender-based violence victims.",
            "category": "Safety",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Crowd Safety Guidelines",
            "content": "Tips for staying safe in crowded areas including how to identify hazards, maintain group cohesion, and exit safely from gatherings.",
            "category": "Safety",
            "last_updated": datetime.utcnow()
        },
        {
            "resource_id": str(uuid.uuid4()),
            "title": "Communication During Emergencies",
            "content": "How to effectively communicate during emergencies, document incidents safely, and protect your privacy while reporting to authorities.",
            "category": "Information",
            "last_updated": datetime.utcnow()
        }
    ]

    updates_data = [
        {
            "update_id": str(uuid.uuid4()),
            "title": "Road Closures Update",
            "summary": "Several roads in CBD are currently closed",
            "full_content": "Moi Avenue, Kenyatta Avenue, and parts of Uhuru Highway are closed due to ongoing demonstrations. Use alternative routes via Harambee Avenue or Valley Road.",
            "timestamp": datetime.utcnow() - timedelta(hours=1),
            "source": "Official"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Medical Teams Deployed",
            "summary": "Additional medical teams have been deployed to CBD",
            "full_content": "Red Cross and St. John Ambulance teams are now stationed at key locations in the city center including All Saints Cathedral and City Hall.",
            "timestamp": datetime.utcnow() - timedelta(minutes=30),
            "source": "Official"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Safe Water Distribution",
            "summary": "Clean water distribution points are active across the city",
            "full_content": "Water distribution centers have been established at Central Park, Jeevanjee Gardens, and City Market. Free water is available for all residents.",
            "timestamp": datetime.utcnow() - timedelta(minutes=15),
            "source": "Community Report"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Legal Aid Services Available",
            "summary": "Free legal consultation services now available",
            "full_content": "Law Society of Kenya and Defenders Coalition are providing free legal consultations at designated centers. No appointment needed. Operating hours 8 AM - 6 PM daily.",
            "timestamp": datetime.utcnow() - timedelta(hours=2),
            "source": "Official"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Shelter Centers Opened",
            "summary": "Emergency shelters now operational in safe zones",
            "full_content": "Multiple emergency shelter centers have opened with food, first aid, and communication facilities. Locations: KICC, Safari Park, and Starehe Boys Centre.",
            "timestamp": datetime.utcnow() - timedelta(hours=3),
            "source": "Official"
        },
        {
            "update_id": str(uuid.uuid4()),
            "title": "Mental Health Support Hotline",
            "summary": "Mental health crisis support available 24/7",
            "full_content": "Psychological support hotline is now operational. Call 0800-234-234 to speak with trained counselors. Services available in English and Swahili.",
            "timestamp": datetime.utcnow() - timedelta(hours=4),
            "source": "Health Service"
        }
    ]

    zones_data = [
        {"name": "CBD", "lat": -1.2921, "lng": 36.8219, "status": "danger", "intensity": 0.8},
        {"name": "Westlands", "lat": -1.2676, "lng": 36.8062, "status": "moderate", "intensity": 0.6},
        {"name": "Kibera", "lat": -1.3133, "lng": 36.7892, "status": "calm", "intensity": 0.3},
    ]

    demo_data = [
        {
            "emergency_contacts": [
                {"name": "Law Society of Kenya (LSK)", "number": "0800720434"},
                {"name": "Defenders Coalition", "number": "0716200100"},
                {"name": "Independent Medico-Legal Unit (IMLU)", "number": "0706162795"},
                {"name": "Kenya National Commission on Human Rights (KNCHR)", "number": "08007260627"},
                {"name": "Amnesty International Kenya", "number": "0759464346"},
                {"name": "Civic Freedoms Forum", "number": "07283033864"},
                {"name": "Kenya Human Rights Commission (KHRC)", "number": "0728606583"},
                {"name": "Kenya Red Cross Society", "number": "0713-638-000"},
                {"name": "St. John Ambulance", "number": "0733-636-0000"},
                {"name": "Nairobi Hospital Emergency", "number": "4722-000"},
                {"name": "National Police Service", "number": "999 or 0721-666-999"},
            ],
            "safety_tips": [
                "Stay hydrated and carry water with you",
                "Keep emergency contacts easily accessible",
                "Stay in groups when possible",
                "Avoid confrontational situations",
                "Know the location of nearest safe zones",
                "Keep your phone charged",
                "Save emergency numbers in your phone",
                "Inform someone of your location and movements",
                "Document incidents safely and securely",
                "Use apps to share real-time location with trusted contacts"
            ],
            "first_aid_basics": [
                "Check for responsiveness and breathing",
                "Call for help immediately",
                "Apply pressure to bleeding wounds",
                "Do not move someone with potential spinal injury",
                "Place unconscious but breathing person in recovery position",
                "Learn CPR if possible",
                "Keep first aid kit readily available",
                "Stay calm and reassure the injured person",
                "Remove the person from immediate danger if safe to do so",
                "Monitor vital signs until help arrives"
            ],
            "legal_rights": [
                "Right to peaceful assembly and demonstration",
                "Right to remain silent if detained",
                "Right to legal representation",
                "Right to medical attention if injured",
                "Right to contact family/lawyer if arrested",
                "Right to know charges against you within 24 hours",
                "Right to refuse searches without warrant",
                "Right to interpreter services if needed",
                "Right to file complaints against police misconduct",
                "Right to dignity and humane treatment in custody"
            ]
        }
    ]

    records_data = [
        {"id": 1, "name": "Medical Supplies", "status": "Available", "quantity": 25, "location": "Nairobi CBD", "last_updated": "2 hours ago"},
        {"id": 2, "name": "Emergency Vehicles", "status": "In Use", "quantity": 8, "location": "Westlands", "last_updated": "15 min ago"},
        {"id": 3, "name": "Communication Equipment", "status": "Available", "quantity": 12, "location": "Kibera", "last_updated": "1 hour ago"},
        {"id": 4, "name": "Legal Support Team", "status": "Available", "quantity": 5, "location": "City Center", "last_updated": "30 min ago"},
    ]

    collections_data = {
        "volunteers": volunteers_data,
        "help_requests": help_requests_data,
        "resources": resources_data,
        "updates": updates_data,
        "zones": zones_data,
        "demo_data": demo_data,
        "records": records_data
    }

    for collection_name, data in collections_data.items():
        if data:
            count = await db[collection_name].count_documents({})
            if count == 0:
                result = await db[collection_name].insert_many(data)
                print(f"   ✅ Inserted {len(result.inserted_ids)} documents into {collection_name}")
            else:
                print(f"   ⚠️  {collection_name} already has {count} documents, skipping...")


async def main():
    """Main initialization function"""
    print("🚀 Starting SOS Nairobi Database Initialization...")
    print("=" * 60)

    try:
        await init_mongodb()
        print("\n✅ Database initialization completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Initialization failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
