#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COCKPIT_URL="${COCKPIT_URL:-http://localhost:4141}"

cd "$REPO_ROOT"

clear
printf "Haven Desk early-access setup\n"
printf "This guided setup starts the local stack on your machine.\n\n"

if [ ! -x "./swiss" ]; then
  printf "Could not find the Haven Desk launcher at ./swiss.\n"
  printf "Make sure this setup file is inside the downloaded Haven Desk folder.\n"
  read -r -p "Press Return to close."
  exit 1
fi

printf "Step 1 of 3: checking and installing prerequisites when possible...\n"
./swiss setup

printf "\nStep 2 of 3: starting Haven Desk...\n"
./swiss up

printf "\nStep 3 of 3: opening Haven Desk in your browser...\n"
open "$COCKPIT_URL"

printf "\nHaven Desk should now be open at %s\n" "$COCKPIT_URL"
printf "If anything looks wrong, run ./swiss doctor in this folder.\n\n"
read -r -p "Press Return to close this window."
