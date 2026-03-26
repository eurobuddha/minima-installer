#!/bin/bash
# ============================================================
#  Minima Node — One-Click Setup for macOS
#  Double-click this file to get started.
# ============================================================

set -e

# Colors for friendly output
GREEN='\033[0;32m'
AMBER='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

clear

echo ""
echo -e "${AMBER}${BOLD}  ● Minima Node Installer${NC}"
echo -e "${DIM}  ─────────────────────────────────${NC}"
echo ""

# ---- Helper functions ----

info()    { echo -e "  ${GREEN}✓${NC} $1"; }
warn()    { echo -e "  ${AMBER}●${NC} $1"; }
fail()    { echo -e "  ${RED}✗${NC} $1"; }
step()    { echo -e "\n  ${BOLD}$1${NC}"; }
waiting() { echo -e "  ${DIM}$1${NC}"; }

press_to_continue() {
  echo ""
  echo -e "  ${DIM}Press any key to continue...${NC}"
  read -n 1 -s
}

# ---- Check macOS ----

if [[ "$(uname)" != "Darwin" ]]; then
  fail "This installer is for macOS only."
  press_to_continue
  exit 1
fi

# ---- Check/Install Java ----

step "Checking for Java..."

if command -v java &>/dev/null; then
  JAVA_VER=$(java -version 2>&1 | head -n1 | sed 's/.*"\(.*\)".*/\1/')
  info "Java found: version $JAVA_VER"
else
  warn "Java is not installed."
  echo ""
  echo -e "  Minima needs Java to run. We'll open the download page for you."
  echo -e "  ${BOLD}Install Java, then run this file again.${NC}"
  echo ""
  echo -e "  ${DIM}Recommended: Adoptium (Eclipse Temurin) — free and open source${NC}"
  echo ""
  press_to_continue
  open "https://adoptium.net"
  exit 0
fi

# ---- Check/Install tmux ----

step "Checking for tmux..."

if command -v tmux &>/dev/null; then
  info "tmux found: $(which tmux)"
else
  warn "tmux is not installed. Attempting to install..."

  # Check for Homebrew first
  if command -v brew &>/dev/null; then
    waiting "Installing tmux via Homebrew..."
    brew install tmux
    if command -v tmux &>/dev/null; then
      info "tmux installed successfully."
    else
      fail "tmux installation failed."
      echo -e "  Please install tmux manually: ${BOLD}brew install tmux${NC}"
      press_to_continue
      exit 1
    fi
  else
    # No Homebrew — install it first, then tmux
    warn "Homebrew not found. Installing Homebrew first..."
    echo ""
    waiting "This may take a minute. You might be asked for your password."
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add Homebrew to PATH for this session (Apple Silicon vs Intel)
    if [[ -f /opt/homebrew/bin/brew ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -f /usr/local/bin/brew ]]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi

    if command -v brew &>/dev/null; then
      info "Homebrew installed."
      waiting "Now installing tmux..."
      brew install tmux
      info "tmux installed."
    else
      fail "Could not install Homebrew automatically."
      echo -e "  Visit ${BOLD}https://brew.sh${NC} to install it, then run this file again."
      press_to_continue
      exit 1
    fi
  fi
fi

# ---- Check/Install Node.js ----

step "Checking for Node.js..."

if command -v node &>/dev/null; then
  NODE_VER=$(node --version)
  info "Node.js found: $NODE_VER"
else
  warn "Node.js is not installed. Installing..."

  if command -v brew &>/dev/null; then
    waiting "Installing Node.js via Homebrew..."
    brew install node
    if command -v node &>/dev/null; then
      info "Node.js installed: $(node --version)"
    else
      fail "Node.js installation failed."
      press_to_continue
      exit 1
    fi
  else
    fail "Could not install Node.js (Homebrew not available)."
    echo -e "  Please install Node.js from ${BOLD}https://nodejs.org${NC} and run this file again."
    press_to_continue
    exit 1
  fi
fi

# ---- Download/Update Minima Installer ----

step "Setting up Minima Installer..."

INSTALL_DIR="$HOME/.minima-installer-tool"

if [[ -d "$INSTALL_DIR" && -f "$INSTALL_DIR/package.json" ]]; then
  info "Minima Installer already downloaded."
  waiting "Checking for updates..."
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || true
else
  waiting "Downloading from GitHub..."
  if git clone https://github.com/eurobuddha/minima-installer.git "$INSTALL_DIR"; then
    info "Downloaded."
  else
    fail "Failed to download. Check your internet connection and try again."
    press_to_continue
    exit 1
  fi
fi

cd "$INSTALL_DIR"

# ---- Install Node dependencies ----

step "Installing dependencies..."

if [[ -d "node_modules" ]]; then
  info "Dependencies already installed."
else
  npm install --silent 2>/dev/null
  info "Dependencies installed."
fi

# ---- Launch the wizard ----

step "Launching setup wizard..."
echo ""
echo -e "  ${GREEN}${BOLD}Opening the Minima setup wizard in your browser...${NC}"
echo -e "  ${DIM}If it doesn't open automatically, go to: http://localhost:8787${NC}"
echo ""
echo -e "  ${DIM}You can close this terminal window after the installer finishes.${NC}"
echo ""

node bin/cli.js
