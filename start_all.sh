#!/bin/bash

################################################################################
# 🚀 CL4R1T4S - Start All Services
# Starts the complete RAG system with all databases and dashboards
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "  🚀 CL4R1T4S - Starting All Services"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# Check if already running
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# Kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Stopping existing process...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Path to workspace virtual environment Python
VENV_PYTHON="$SCRIPT_DIR/.venv/bin/python"
if [ ! -f "$VENV_PYTHON" ]; then
    echo -e "${YELLOW}⚠️  .venv not found at $VENV_PYTHON, falling back to python3${NC}"
    VENV_PYTHON="python3"
else
    echo -e "${GREEN}✅ Using workspace virtual environment: $VENV_PYTHON${NC}"
fi

# Check Python dependencies
echo -e "\n${BLUE}📦 Checking dependencies...${NC}"
$VENV_PYTHON -c "import sqlite3, sys" 2>/dev/null || {
    echo -e "${RED}❌ Python not found in $VENV_PYTHON${NC}"
    exit 1
}

# Create log directory
LOG_DIR="$SCRIPT_DIR/logs"
mkdir -p "$LOG_DIR"

echo -e "${GREEN}✅ Dependencies OK${NC}"

# 1. Start Main Academy Server (port 3300)
echo -e "\n${BLUE}🌐 Starting Academy Server (port 3300)...${NC}"
kill_port 3300
cd "$SCRIPT_DIR/agent-studio/server"
nohup "$VENV_PYTHON" serve.py > "$LOG_DIR/academy.log" 2>&1 &
ACADEMY_PID=$!
echo -e "${GREEN}✅ Academy Server started (PID: $ACADEMY_PID)${NC}"
echo "   URL: http://localhost:3300"
echo "   Log: $LOG_DIR/academy.log"

# Wait for academy to start
sleep 3

# 2. Start Multi-DB Dashboard (port 5000)
echo -e "\n${BLUE}📊 Starting Multi-DB Dashboard (port 5000)...${NC}"
kill_port 5000
cd "$SCRIPT_DIR/agent-studio/server"
nohup "$VENV_PYTHON" rag_dashboard.py --port 5000 > "$LOG_DIR/dashboard.log" 2>&1 &
DASHBOARD_PID=$!
echo -e "${GREEN}✅ Dashboard started (PID: $DASHBOARD_PID)${NC}"
echo "   URL: http://localhost:5000"
echo "   Log: $LOG_DIR/dashboard.log"

# Wait for dashboard to start
sleep 2

# 3. Check Ollama (for embeddings)
echo -e "\n${BLUE}🔧 Checking Ollama service...${NC}"
if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Ollama not running. Starting...${NC}"
    nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
    sleep 3
    echo -e "${GREEN}✅ Ollama started${NC}"
else
    echo -e "${GREEN}✅ Ollama already running${NC}"
fi

# Check if nomic-embed-text model is available
if ollama list | grep -q "nomic-embed-text"; then
    echo -e "${GREEN}✅ nomic-embed-text model available${NC}"
else
    echo -e "${YELLOW}⚠️  Pulling nomic-embed-text model...${NC}"
    ollama pull nomic-embed-text
fi

# Summary
echo -e "\n${GREEN}"
echo "════════════════════════════════════════════════════════════════"
echo "  ✅ All Services Started Successfully!"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

echo -e "\n${BLUE}🌐 Access Points:${NC}"
echo "  • Main Academy:       http://localhost:3300"
echo "  • System Overview:    http://localhost:3300/academy/system-overview.html"
echo "  • Unified Dashboard:  http://localhost:3300/academy/unified-dashboard.html"
echo "  • Multi-DB Dashboard: http://localhost:5000"
echo "  • Ollama API:         http://localhost:11434"

echo -e "\n${BLUE}📊 Quick Stats:${NC}"
cd "$SCRIPT_DIR/agent-studio/server"
"$VENV_PYTHON" -c "
try:
    from rag_engine_enhanced import get_all_statistics
    stats = get_all_statistics()
    print(f'  • Total Books: {stats[\"total_books\"]}')
    print(f'  • Total Chunks: {stats[\"total_chunks\"]:,}')
    print(f'  • Active Databases: {sum(1 for s in stats[\"role_statistics\"].values() if s[\"books_count\"] > 0)}/11')
except Exception as e:
    print('  • Statistics unavailable (databases may be empty)')
" 2>/dev/null || echo "  • Statistics unavailable"

echo -e "\n${BLUE}📝 Process IDs:${NC}"
echo "  • Academy Server: $ACADEMY_PID"
echo "  • Dashboard: $DASHBOARD_PID"

echo -e "\n${BLUE}📋 Logs:${NC}"
echo "  • Academy: $LOG_DIR/academy.log"
echo "  • Dashboard: $LOG_DIR/dashboard.log"
echo "  • Ollama: $LOG_DIR/ollama.log"

echo -e "\n${YELLOW}⚠️  To stop all services, run:${NC}"
echo "   ./stop_all.sh"
echo -e "\n${YELLOW}⚠️  Or manually:${NC}"
echo "   lsof -ti:3300,5000,11434 | xargs kill"

echo -e "\n${GREEN}🎉 System ready! Open http://localhost:3300 to get started${NC}\n"
