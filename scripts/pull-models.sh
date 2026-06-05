#!/usr/bin/env bash
set -e
# Two chat tiers so you can trade output quality for RAM (switch live in the
# cockpit: Settings → Model):
#   QUALITY — best output, heavier (~10-14 GB RAM)
#   LIGHT   — Gemma "effective-4B"; much lighter (~4 GB). Pick this when the
#             full Docker stack (Open WebUI) is also running, so a 12B model +
#             containers don't nearly fill 48 GB of RAM.
QUALITY="${OLLAMA_MODEL:-gemma4:12b-mlx}"
LIGHT="${OLLAMA_LIGHT_MODEL:-gemma4:e4b}"
EMBED="${EMBED_MODEL:-embeddinggemma}"

PULLED=""
for M in "$QUALITY" "$LIGHT"; do
  case " $PULLED " in *" $M "*) continue ;; esac # skip if already pulled this run
  echo "Pulling chat model: $M"
  ollama pull "$M"
  PULLED="$PULLED $M"
done

echo "Pulling embedding model (for Open WebUI RAG; optional): $EMBED"
ollama pull "$EMBED" || echo "  (embedding model optional for now — skipping)"
