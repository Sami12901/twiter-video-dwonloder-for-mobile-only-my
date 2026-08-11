#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
#   NEXUS PLATFORM - Termux 1-Click Setup
#   Target: Realme 11 5G (Android / Termux)
#   Run: bash setup.sh
# ============================================================

set -e

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     NEXUS PLATFORM - TERMUX SETUP        ║"
echo "  ║   Social Platform & Video Downloader      ║"
echo "  ║   Optimized for Realme 11 5G              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# ----------------------------------------------------------
# Step 1: System packages
# ----------------------------------------------------------
echo "[1/6] Installing system packages..."
pkg update -y && pkg upgrade -y
pkg install -y nodejs-lts git python make clang binutils
echo "  ✓ System packages installed"

# ----------------------------------------------------------
# Step 2: Storage access
# ----------------------------------------------------------
echo ""
echo "[2/6] Setting up storage access..."
termux-setup-storage || true
sleep 2
echo "  ✓ Storage access configured"

# ----------------------------------------------------------
# Step 3: Clone the repository
# ----------------------------------------------------------
echo ""
echo "[3/6] Cloning repository..."
REPO_DIR="$HOME/nexus-platform"

if [ -d "$REPO_DIR" ]; then
  echo "  Directory exists, pulling latest..."
  cd "$REPO_DIR"
  git pull origin main || true
else
  git clone https://github.com/Sami12901/twiter-video-dwonloder-for-mobile-only-my.git "$REPO_DIR"
  cd "$REPO_DIR"
fi
echo "  ✓ Repository ready"

# ----------------------------------------------------------
# Step 4: Install NPM dependencies
# ----------------------------------------------------------
echo ""
echo "[4/6] Installing dependencies (this takes 2-3 minutes)..."
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
echo "  ✓ Dependencies installed"

# ----------------------------------------------------------
# Step 5: Setup database
# ----------------------------------------------------------
echo ""
echo "[5/6] Setting up SQLite database..."
cd backend
echo 'DATABASE_URL="file:./dev.db"' > .env
npx prisma generate
npx prisma db push --accept-data-loss
cd ..
echo "  ✓ Database ready"

# ----------------------------------------------------------
# Step 6: Create launcher script
# ----------------------------------------------------------
echo ""
echo "[6/6] Creating launcher..."

cat > "$HOME/nexus-start.sh" << 'LAUNCHER'
#!/data/data/com.termux/files/usr/bin/bash
cd "$HOME/nexus-platform"

echo ""
echo "  Starting Nexus Platform..."
echo "  Backend : http://127.0.0.1:3000"
echo "  Frontend: http://127.0.0.1:5173"
echo ""
echo "  Open Chrome and go to: http://127.0.0.1:5173"
echo "  Press Ctrl+C to stop."
echo ""

# Start backend in background
cd backend && npx tsx src/index.ts &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend && npx vite --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
cd ..

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
LAUNCHER

chmod +x "$HOME/nexus-start.sh"

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║         SETUP COMPLETE! ✓                ║"
echo "  ╠══════════════════════════════════════════╣"
echo "  ║                                          ║"
echo "  ║  To start the platform, run:             ║"
echo "  ║                                          ║"
echo "  ║    bash ~/nexus-start.sh                 ║"
echo "  ║                                          ║"
echo "  ║  Then open Chrome:                       ║"
echo "  ║    http://127.0.0.1:5173                 ║"
echo "  ║                                          ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
