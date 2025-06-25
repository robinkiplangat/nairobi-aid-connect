# 🌟 Nairobi Aid Connect

A real-time emergency response coordination platform for Nairobi, Kenya. This multi-agent system connects people in need with verified volunteers and emergency services through an intelligent, location-based matching system.

## 🚨 What is Nairobi Aid Connect?

Nairobi Aid Connect is a comprehensive emergency response platform designed to:

- **Connect people in crisis** with nearby verified volunteers and emergency services
- **Provide real-time coordination** between requesters, volunteers, and emergency responders
- **Offer location-based matching** with privacy protection through coordinate obfuscation
- **Monitor social media** for emergency mentions and automatically process requests
- **Maintain a resource hub** with emergency contacts, shelter locations, and helpful information

## 🏗️ Architecture

The application uses a **multi-agent system** architecture with the following components:

### 🤖 Intelligent Agents
- **Intake Agent**: Processes help requests from direct submissions and social media monitoring
- **Verification Agent**: Handles volunteer verification and credential management
- **Dispatcher Agent**: Matches requests with appropriate volunteers based on location and skills
- **Comms Agent**: Manages real-time chat sessions between requesters and volunteers
- **Content Agent**: Maintains resource hub and provides real-time updates

### 🛠️ Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- shadcn/ui for modern UI components
- Real-time WebSocket communication

**Backend:**
- FastAPI (Python) for high-performance API
- MongoDB with Motor for async database operations
- Redis for message bus and caching
- WebSocket support for real-time features
- Twitter API integration for social media monitoring

**Infrastructure:**
- Multi-agent system architecture
- Event-driven message bus
- Location-based services with privacy protection
- Real-time geospatial matching

## ✨ Key Features

### 🆘 Emergency Request System
- Direct help request submission through the app
- Social media monitoring (Twitter) for emergency mentions
- Automatic location detection and geocoding
- Privacy protection through coordinate obfuscation

### 👥 Volunteer Management
- Volunteer registration and verification system
- Skill-based matching (Medical, Legal, Shelter, etc.)
- Location-based volunteer discovery
- Real-time availability status

### 💬 Real-time Communication
- WebSocket-based chat system
- Secure room-based messaging
- Real-time status updates
- Emergency broadcast capabilities

### 🗺️ Interactive Map
- Real-time emergency hotspots
- Volunteer location tracking
- Privacy-protected coordinate display
- Geographic clustering of requests

### 📱 Resource Hub
- Emergency contact information
- Shelter and safe house locations
- Legal aid resources
- Medical facility directories

## 🚀 Quick Start

### Prerequisites

Before running the application, ensure you have:

- **Python 3.9+** installed
- **Node.js 18+** and **npm** installed
- **MongoDB** (optional - for full functionality)
- **Redis** (optional - for message bus and caching)

### One-Command Deployment

The easiest way to get started is using our deployment script:

```bash
# Clone the repository
git clone https://github.com/robinkiplangat/nairobi-aid-connect.git
cd nairobi-aid-connect

# Make the deployment script executable
chmod +x deploy.sh

# Run the full setup and start the application
./deploy.sh
```

This will:
- ✅ Check system requirements
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Create configuration files
- ✅ Start MongoDB and Redis (if available)
- ✅ Launch both backend and frontend servers

### Manual Setup

If you prefer to set up manually:

#### Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Configuration section)
cp .env.example .env

# Start the backend server
PYTHONPATH=.. uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE_NAME=sos_nairobi_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# API Keys (replace with actual values)
TWITTER_BEARER_TOKEN=YOUR_TWITTER_BEARER_TOKEN_HERE
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE

# App Settings
APP_ENV=development
DEBUG_MODE=true
ENABLE_TWITTER_MONITORING=false
LOCATION_OBFUSCATION_FACTOR=0.001
VOLUNTEER_MATCH_RADIUS_KM=5.0
CHAT_SESSION_TTL_HOURS=24
```

### API Keys Setup

1. **Twitter API**: Get a Bearer Token from [Twitter Developer Portal](https://developer.twitter.com/)
2. **Google API**: Get an API key from [Google Cloud Console](https://console.cloud.google.com/) for NLP and geocoding services

## 📡 API Endpoints

### Core Endpoints
- `GET /` - Health check
- `POST /api/v1/request/direct` - Submit help request
- `POST /api/v1/volunteer/verify` - Verify volunteer
- `GET /api/v1/content/updates` - Get real-time updates
- `GET /api/v1/content/resources` - Get resource hub content
- `GET /api/v1/map/hotspots` - Get map hotspots

### WebSocket Endpoints
- `WS /ws/chat/{chat_room_id}/{user_token}` - Real-time chat

### API Documentation
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🏃‍♂️ Running the Application

### Using the Deployment Script

```bash
# Full setup and run
./deploy.sh

# Only setup dependencies
./deploy.sh setup

# Only start the application
./deploy.sh start

# Check system requirements
./deploy.sh check

# Show help
./deploy.sh help
```

### Manual Commands

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
PYTHONPATH=.. uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
npm run dev
```

## 🌐 Access Points

Once running, access the application at:

- **Frontend Application**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Tests
```bash
npm run test
```

## 📦 Deployment

### Development
The application is ready for development with hot-reload enabled.

### Production
For production deployment:

1. **Build the frontend**:
   ```bash
   npm run build
   ```

2. **Set up production environment variables**:
   ```bash
   APP_ENV=production
   DEBUG_MODE=false
   ```

3. **Use a production WSGI server**:
   ```bash
   pip install gunicorn
   gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

4. **Set up reverse proxy** (nginx recommended) for serving static files and SSL termination.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation at http://localhost:8000/docs
- Review the deployment script help: `./deploy.sh help`

## 🙏 Acknowledgments

- Built with FastAPI and React
- UI components from shadcn/ui
- Styling with Tailwind CSS
- Real-time features powered by WebSockets
- Location services with privacy protection

---

**Nairobi Aid Connect** - Connecting communities in times of need. 🇰🇪
