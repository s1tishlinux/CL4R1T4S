#!/bin/bash

################################################################################
# 🛑 CL4R1T4S - Stop All Services
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "  🛑 CL4R1T4S - Stopping All Services"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Function to kill processes on port
kill_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Stopping $name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ $name stopped${NC}"
    else
        echo -e "${BLUE}ℹ️  $name not running on port $port${NC}"
    fi
}

# Stop services
kill_port 3300 "Academy Server"
kill_port 5000 "Multi-DB Dashboard"
kill_port 11434 "Ollama (optional)"

echo -e "\n${GREEN}"
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ All Services Stopped"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}\n"
