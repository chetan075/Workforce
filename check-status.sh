#!/bin/bash

# ChainBill Deployment Status Checker
echo "📊 ChainBill Deployment Status"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "localhost")

echo "🌐 Public IP: $PUBLIC_IP"
echo ""

# Check Docker
echo "🐳 Docker Status:"
docker --version > /dev/null 2>&1
check_status $? "Docker installed"

docker ps > /dev/null 2>&1
check_status $? "Docker running"

# Check Docker Compose
docker-compose --version > /dev/null 2>&1
check_status $? "Docker Compose installed"

echo ""

# Check if project files exist
echo "📁 Project Files:"
[ -f "docker-compose.yml" ]
check_status $? "docker-compose.yml exists"

[ -f "Dockerfile" ]
check_status $? "Dockerfile exists"

[ -f ".env.production" ]
check_status $? ".env.production exists"

echo ""

# Check containers
echo "📦 Container Status:"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running${NC}"
    docker-compose ps
else
    echo -e "${RED}❌ Containers not running${NC}"
    echo "To start: docker-compose up -d"
fi

echo ""

# Check application endpoints
echo "🌐 Application Health:"

# Check backend
if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API (port 5000) - Healthy${NC}"
else
    echo -e "${RED}❌ Backend API (port 5000) - Not responding${NC}"
fi

# Check frontend
if curl -s -I http://localhost:3000 | grep -q "200\|404"; then
    echo -e "${GREEN}✅ Frontend (port 3000) - Accessible${NC}"
else
    echo -e "${RED}❌ Frontend (port 3000) - Not accessible${NC}"
fi

echo ""

# Show access URLs
echo "🔗 Access URLs:"
echo "   Frontend:    http://$PUBLIC_IP:3000"
echo "   Backend API: http://$PUBLIC_IP:5000"
echo "   Health:      http://$PUBLIC_IP:5000/health"

echo ""

# Show useful commands
echo "🔧 Useful Commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Restart app:      docker-compose restart"
echo "   Stop app:         docker-compose down"
echo "   Rebuild & start:  docker-compose up --build -d"
echo "   System resources: htop"

echo ""

# Check system resources
echo "💻 System Resources:"
echo "Memory usage:"
free -h | grep Mem

echo ""
echo "Disk usage:"
df -h | grep -E "/$|/dev/"

echo ""
echo "📊 Status check completed!"