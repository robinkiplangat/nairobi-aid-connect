#!/bin/bash

# Nairobi Aid Connect - Deployment Script
# This script sets up and runs the entire application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3 is required but not installed."
        exit 1
    fi
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is required but not installed."
        print_warning "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is required but not installed."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
        print_error "Please run this script from the project root directory."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    print_status "Activating virtual environment..."
    source venv/bin/activate
    
    # Upgrade pip
    print_status "Upgrading pip..."
    pip install --upgrade pip
    
    # Install requirements
    print_status "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        print_status "Creating .env file with default settings..."
        cat > .env << EOF
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
GOOGLE_API_KEY=

# App Settings
APP_ENV=development
DEBUG_MODE=true
ENABLE_TWITTER_MONITORING=false
EOF
        print_warning "Created default .env file. Please update with your actual API keys."
    fi
    
    cd ..
    print_success "Backend setup completed"
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    # Install npm dependencies
    print_status "Installing npm dependencies..."
    npm install
    
    print_success "Frontend setup completed"
}

# Function to check if services are running
check_services() {
    print_status "Checking required services..."
    
    # Check MongoDB
    if ! command_exists mongod; then
        print_warning "MongoDB is not installed or not in PATH."
        print_warning "Please install MongoDB: https://docs.mongodb.com/manual/installation/"
    else
        if pgrep -x "mongod" > /dev/null; then
            print_success "MongoDB is running"
        else
            print_warning "MongoDB is not running. Please start it manually."
        fi
    fi
    
    # Check Redis
    if ! command_exists redis-server; then
        print_warning "Redis is not installed or not in PATH."
        print_warning "Please install Redis: https://redis.io/download"
    else
        if pgrep -x "redis-server" > /dev/null; then
            print_success "Redis is running"
        else
            print_warning "Redis is not running. Please start it manually."
        fi
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Start MongoDB if not running
    if command_exists mongod && ! pgrep -x "mongod" > /dev/null; then
        print_status "Starting MongoDB..."
        mongod --fork --logpath /tmp/mongod.log --dbpath /tmp/mongodb
        sleep 2
    fi
    
    # Start Redis if not running
    if command_exists redis-server && ! pgrep -x "redis-server" > /dev/null; then
        print_status "Starting Redis..."
        redis-server --daemonize yes
        sleep 1
    fi
}

# Function to run the application
run_app() {
    print_status "Starting Nairobi Aid Connect application..."
    
    # Start backend in background
    print_status "Starting backend server..."
    cd backend
    source venv/bin/activate
    PYTHONPATH=.. uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend in background
    print_status "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait a moment for frontend to start
    sleep 3
    
    print_success "Application started successfully!"
    echo ""
    echo "🌐 Frontend: http://localhost:5173"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 API Documentation: http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop the application"
    echo ""
    
    # Function to cleanup on exit
    cleanup() {
        print_status "Shutting down application..."
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Application stopped"
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Wait for background processes
    wait
}

# Function to show help
show_help() {
    echo "Nairobi Aid Connect - Deployment Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  setup     - Setup the application (install dependencies, create config)"
    echo "  start     - Start the application (backend + frontend)"
    echo "  run       - Setup and start the application (default)"
    echo "  check     - Check system requirements and services"
    echo "  help      - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup    # Only setup dependencies"
    echo "  $0 start    # Only start the application"
    echo "  $0          # Setup and start (default)"
}

# Main script logic
main() {
    case "${1:-run}" in
        "setup")
            check_requirements
            setup_backend
            setup_frontend
            print_success "Setup completed successfully!"
            ;;
        "start")
            check_services
            start_services
            run_app
            ;;
        "run")
            check_requirements
            setup_backend
            setup_frontend
            check_services
            start_services
            run_app
            ;;
        "check")
            check_requirements
            check_services
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 