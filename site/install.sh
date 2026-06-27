#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Haven Desk"
REPO_URL="${HAVEN_DESK_REPO:-https://github.com/omerakben/swiss-knife.git}"
BRANCH="${HAVEN_DESK_BRANCH:-main}"
INSTALL_DIR="${HAVEN_DESK_HOME:-$HOME/HavenDesk}"
APP_URL="${HAVEN_DESK_URL:-http://localhost:4141}"

say() { printf "\033[1m%s\033[0m\n" "$1"; }
ok() { printf "  \033[32mOK\033[0m %s\n" "$1"; }
note() { printf "  \033[33mNOTE\033[0m %s\n" "$1"; }
fail() {
  printf "  \033[31mERR\033[0m %s\n" "$1" >&2
  exit 1
}

has_cmd() { command -v "$1" >/dev/null 2>&1; }

wait_for_docker() {
  has_cmd docker || return 1
  local i
  for i in $(seq 1 180); do
    if docker info >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

open_url() {
  case "$(uname -s)" in
    Darwin) open "$APP_URL" >/dev/null 2>&1 || true ;;
    Linux)
      if has_cmd xdg-open; then xdg-open "$APP_URL" >/dev/null 2>&1 || true; fi
      ;;
  esac
}

say "$APP_NAME quick start"

case "$(uname -s)" in
  Darwin)
    ok "macOS detected"
    ;;
  Linux)
    fail "Linux one-line setup is not supported yet. Install Docker + Ollama manually, clone $REPO_URL, then run ./swiss up."
    ;;
  *)
    fail "Unsupported OS for this installer. Use the Windows PowerShell command on Windows."
    ;;
esac

if ! has_cmd git; then
  if ! has_cmd brew; then
    note "Homebrew is missing. Installing Homebrew first."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ -x /opt/homebrew/bin/brew ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [ -x /usr/local/bin/brew ]; then
      eval "$(/usr/local/bin/brew shellenv)"
    fi
  fi
  if has_cmd brew; then
    note "Git is missing. Installing Git with Homebrew."
    brew install git
  fi
fi

if ! has_cmd git; then
  fail "Git is required to download Haven Desk. Install Git, then rerun this command."
fi

if [ -d "$INSTALL_DIR/.git" ]; then
  say "Updating $INSTALL_DIR"
  git -C "$INSTALL_DIR" fetch --depth 1 origin "$BRANCH"
  git -C "$INSTALL_DIR" checkout "$BRANCH"
  git -C "$INSTALL_DIR" pull --ff-only origin "$BRANCH"
  ok "Repository updated"
elif [ -e "$INSTALL_DIR" ] && [ -n "$(find "$INSTALL_DIR" -mindepth 1 -maxdepth 1 2>/dev/null | head -n 1)" ]; then
  fail "$INSTALL_DIR exists and is not an empty Haven Desk checkout. Set HAVEN_DESK_HOME to another folder and rerun."
else
  say "Downloading Haven Desk to $INSTALL_DIR"
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
  ok "Repository downloaded"
fi

cd "$INSTALL_DIR"
chmod +x ./swiss

say "Installing prerequisites"
./swiss setup

if has_cmd docker && ! docker info >/dev/null 2>&1; then
  note "Starting Docker Desktop. Accept any first-run prompts if they appear."
  open -a Docker >/dev/null 2>&1 || true
  if ! wait_for_docker; then
    fail "Docker Desktop did not become ready. Open Docker Desktop, finish setup, then run: cd \"$INSTALL_DIR\" && ./swiss up"
  fi
fi

say "Starting Haven Desk"
./swiss up
open_url

say "Ready"
ok "Haven Desk: $APP_URL"
