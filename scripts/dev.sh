#!/bin/bash
# FHIR Healthcare Bootcamp Development Environment Startup Script

set -e  # Exit on error

echo "🚀 Starting FHIR Healthcare Bootcamp Development Environment"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name is ready!${NC}"
            return 0
        fi
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - $service_name not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service_name failed to start within timeout${NC}"
    return 1
}

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js and npm are installed${NC}"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check for Docker (optional for local HAPI FHIR server)
DOCKER_AVAILABLE=false
if command_exists docker && docker info >/dev/null 2>&1; then
    DOCKER_AVAILABLE=true
    echo -e "${GREEN}✅ Docker is available${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not available - local HAPI FHIR server will not be started${NC}"
fi

# Check environment variables
echo -e "${BLUE}🔧 Checking environment configuration...${NC}"

if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Please create one based on .env.example${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}💡 You can copy .env.example to .env and update the values${NC}"
        echo -e "${YELLOW}   cp .env.example .env${NC}"
    fi
fi

# Start Docker services (if available and docker-compose.yml exists)
if [ "$DOCKER_AVAILABLE" = true ] && [ -f "docker-compose.yml" ]; then
    echo -e "${BLUE}🐳 Starting Docker services...${NC}"
    
    # Check if local HAPI is already running
    if port_in_use 8080; then
        echo -e "${YELLOW}⚠️  Port 8080 is already in use - skipping Docker startup${NC}"
    else
        # Start Docker services in background
        docker-compose up -d local-hapi
        
        # Wait for HAPI FHIR server to be ready
        wait_for_service "http://localhost:8080/fhir/metadata" "Local HAPI FHIR Server"
    fi
fi

# Check for port conflicts
echo -e "${BLUE}🔍 Checking for port conflicts...${NC}"

if port_in_use 5000; then
    echo -e "${RED}❌ Port 5000 is already in use${NC}"
    echo -e "${YELLOW}💡 Please stop the service using port 5000 or change the port configuration${NC}"
    exit 1
fi

# Start the application
echo -e "${BLUE}🎯 Starting FHIR Healthcare Bootcamp application...${NC}"
echo ""
echo -e "${GREEN}🔗 Application will be available at: http://localhost:5000${NC}"

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo -e "${GREEN}🔗 Local HAPI FHIR Server: http://localhost:8080/fhir${NC}"
fi

echo ""
echo -e "${YELLOW}📝 Press Ctrl+C to stop all services${NC}"
echo ""

# Trap to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill background processes
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    
    # Stop Docker services if they were started
    if [ "$DOCKER_AVAILABLE" = true ] && [ -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}🐳 Stopping Docker services...${NC}"
        docker-compose down
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start the main application
npm run dev &
APP_PID=$!

# Wait for the application process
wait $APP_PID