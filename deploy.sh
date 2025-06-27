#!/bin/bash

# Nairobi Aid Connect Deployment Script
# This script deploys both frontend and backend with the new domain configuration

set -e  # Exit on any error

echo "🚀 Starting Nairobi Aid Connect Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DOMAIN="sos-nairobi.space"
BACKEND_DOMAIN="api.sos-nairobi.space"
FRONTEND_URL="https://${FRONTEND_DOMAIN}"
BACKEND_URL="https://${BACKEND_DOMAIN}"

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "  Frontend: ${GREEN}${FRONTEND_URL}${NC}"
echo -e "  Backend:  ${GREEN}${BACKEND_URL}${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check deployment status
check_deployment() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}🔍 Checking ${name} deployment...${NC}"
    
    if curl -s -f "$url" > /dev/null; then
        echo -e "${GREEN}✅ ${name} is accessible at ${url}${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} is not accessible at ${url}${NC}"
        return 1
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    echo -e "${YELLOW}🧪 Testing API endpoints...${NC}"
    
    # Test health endpoint
    if curl -s -f "${BACKEND_URL}/" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi
    
    # Test CORS
    if curl -s -f -H "Origin: ${FRONTEND_URL}" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        -X OPTIONS "${BACKEND_URL}/api/v1/request/direct" > /dev/null; then
        echo -e "${GREEN}✅ CORS configuration working${NC}"
    else
        echo -e "${RED}❌ CORS configuration failed${NC}"
    fi
    
    # Test API documentation
    if curl -s -f "${BACKEND_URL}/docs" > /dev/null; then
        echo -e "${GREEN}✅ API documentation accessible${NC}"
    else
        echo -e "${RED}❌ API documentation not accessible${NC}"
    fi
}

# Check prerequisites
echo -e "${BLUE}🔧 Checking prerequisites...${NC}"

if ! command_exists curl; then
    echo -e "${RED}❌ curl is required but not installed${NC}"
    exit 1
fi

if ! command_exists git; then
    echo -e "${RED}❌ git is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Check current git status
echo -e "${BLUE}📊 Checking git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes. Consider committing them before deployment.${NC}"
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled.${NC}"
        exit 0
    fi
fi

# Frontend deployment instructions
echo -e "${BLUE}🌐 Frontend Deployment (Vercel)${NC}"
echo -e "${YELLOW}Please ensure the following environment variables are set in your Vercel dashboard:${NC}"
echo -e "  VITE_API_BASE_URL=${BACKEND_URL}"
echo -e "  VITE_APP_ENV=production"
echo -e "  VITE_ENABLE_HTTPS_ONLY=true"
echo -e "  VITE_ENABLE_CONTENT_SECURITY_POLICY=true"

# Backend deployment instructions
echo -e "${BLUE}🔧 Backend Deployment (Render/Cloud Run)${NC}"
echo -e "${YELLOW}Please ensure the following environment variables are set:${NC}"
echo -e "  APP_ENV=production"
echo -e "  DEBUG_MODE=false"
echo -e "  CORS_ALLOWED_ORIGINS=${FRONTEND_URL},https://www.${FRONTEND_DOMAIN}"
echo -e "  REQUIRE_HTTPS=true"
echo -e "  ENABLE_RATE_LIMITING=true"

# Wait for user confirmation
echo
read -p "Have you configured the environment variables and deployed both services? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please configure the environment variables and deploy the services first.${NC}"
    exit 0
fi

# Test deployments
echo -e "${BLUE}🧪 Testing deployments...${NC}"

# Test frontend
if check_deployment "$FRONTEND_URL" "Frontend"; then
    echo -e "${GREEN}✅ Frontend deployment successful${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed or not accessible${NC}"
    echo -e "${YELLOW}Please check your Vercel deployment and domain configuration.${NC}"
fi

# Test backend
if check_deployment "$BACKEND_URL" "Backend"; then
    echo -e "${GREEN}✅ Backend deployment successful${NC}"
    test_api_endpoints
else
    echo -e "${RED}❌ Backend deployment failed or not accessible${NC}"
    echo -e "${YELLOW}Please check your backend deployment and domain configuration.${NC}"
fi

# Final verification
echo -e "${BLUE}🎯 Final verification...${NC}"

# Test frontend to backend communication
echo -e "${YELLOW}Testing frontend to backend communication...${NC}"
if curl -s -f -H "Origin: ${FRONTEND_URL}" \
    -H "Access-Control-Request-Method: GET" \
    -X OPTIONS "${BACKEND_URL}/" > /dev/null; then
    echo -e "${GREEN}✅ Frontend can communicate with backend${NC}"
else
    echo -e "${RED}❌ Frontend cannot communicate with backend${NC}"
    echo -e "${YELLOW}Check CORS configuration in backend environment variables.${NC}"
fi

echo
echo -e "${GREEN}🎉 Deployment verification complete!${NC}"
echo
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "  1. Test the application manually at ${FRONTEND_URL}"
echo -e "  2. Verify all features are working correctly"
echo -e "  3. Monitor logs for any errors"
echo -e "  4. Set up monitoring and alerting if needed"
echo
echo -e "${BLUE}🔗 Useful URLs:${NC}"
echo -e "  Frontend: ${FRONTEND_URL}"
echo -e "  Backend API: ${BACKEND_URL}"
echo -e "  API Documentation: ${BACKEND_URL}/docs"
echo
echo -e "${GREEN}✅ Deployment script completed successfully!${NC}" 