#!/bin/bash

# Firebase + Cloud Run Deployment Script
# This script deploys the frontend to Firebase Hosting and backend to Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="sos-nairobi-connect"
REGION="europe-west1"
FRONTEND_URL="https://sos-nairobi-connect.web.app"
BACKEND_SERVICE="sos-ke-triage-backend"

echo -e "${GREEN}🚀 Starting Firebase + Cloud Run Deployment${NC}"

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}📋 Checking requirements...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK.${NC}"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        echo -e "${RED}❌ Firebase CLI not found. Please install: npm install -g firebase-tools${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not found. Please install Docker.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements met${NC}"
}

# Authenticate and set project
setup_gcloud() {
    echo -e "${YELLOW}🔐 Setting up Google Cloud...${NC}"
    
    # Check if already authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        echo -e "${YELLOW}Please authenticate with Google Cloud...${NC}"
        gcloud auth login
    fi
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    
    echo -e "${GREEN}✅ Google Cloud setup complete${NC}"
}

# Build and deploy frontend to Firebase
deploy_frontend() {
    echo -e "${YELLOW}🏗️  Building frontend...${NC}"
    
    # Install dependencies
    npm ci
    
    # Build with production environment
    export VITE_API_BASE_URL="https://${BACKEND_SERVICE}-${REGION}-${PROJECT_ID}.a.run.app"
    export VITE_APP_ENV="production"
    
    npm run build
    
    echo -e "${YELLOW}🚀 Deploying to Firebase Hosting...${NC}"
    
    # Deploy to Firebase
    firebase deploy --only hosting --project $PROJECT_ID
    
    echo -e "${GREEN}✅ Frontend deployed to: ${FRONTEND_URL}${NC}"
}

# Build and deploy backend to Cloud Run
deploy_backend() {
    echo -e "${YELLOW}🐳 Building backend container...${NC}"
    
    # Build Docker image
    docker build -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE ./backend
    
    echo -e "${YELLOW}📤 Pushing to Container Registry...${NC}"
    
    # Push to Container Registry
    docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE
    
    echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
    
    # Deploy to Cloud Run
    gcloud run deploy $BACKEND_SERVICE \
        --image gcr.io/$PROJECT_ID/$BACKEND_SERVICE \
        --region $REGION \
        --platform managed \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --max-instances 5 \
        --set-env-vars ENVIRONMENT=production \
        --port 8000
    
    # Get the service URL
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    
    echo -e "${GREEN}✅ Backend deployed to: ${BACKEND_URL}${NC}"
}

# Update environment variables
update_env_vars() {
    echo -e "${YELLOW}🔧 Updating environment variables...${NC}"
    
    # Create .env.production with the correct backend URL
    cat > .env.production << EOF
VITE_API_BASE_URL=https://${BACKEND_SERVICE}-${REGION}-${PROJECT_ID}.a.run.app
VITE_APP_ENV=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_APP_VERSION=1.0.0
VITE_ENABLE_HTTPS_ONLY=true
VITE_ENABLE_CONTENT_SECURITY_POLICY=true
VITE_ENABLE_TWITTER_INTEGRATION=true
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_ENABLE_MAP_FEATURES=true
EOF
    
    echo -e "${GREEN}✅ Environment variables updated${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    # Wait a moment for services to be ready
    sleep 30
    
    # Check frontend
    if curl -f -s "$FRONTEND_URL" > /dev/null; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
    fi
    
    # Check backend
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    if curl -f -s "$BACKEND_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi
}

# Main deployment flow
main() {
    check_requirements
    setup_gcloud
    update_env_vars
    deploy_frontend
    deploy_backend
    health_check
    
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo -e "${GREEN}Frontend: ${FRONTEND_URL}${NC}"
    echo -e "${GREEN}Backend: https://${BACKEND_SERVICE}-${REGION}-${PROJECT_ID}.a.run.app${NC}"
}

# Run main function
main "$@" 