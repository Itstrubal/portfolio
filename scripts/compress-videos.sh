#!/usr/bin/env bash
# Shrinks the case-study videos (some are 40-65 MB straight out of Figma)
# to web-friendly sizes. Needs ffmpeg:  brew install ffmpeg  /  winget install ffmpeg
# Run from the project folder:  bash scripts/compress-videos.sh
# Originals are kept in assets/originals/ in case you want to redo it.

set -euo pipefail
cd "$(dirname "$0")/../assets"

command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Install it first."; exit 1; }
mkdir -p originals

for f in *.mp4; do
  [ -e "originals/$f" ] && { echo "skip  $f (already compressed)"; continue; }
  mv "$f" "originals/$f"
  # Max 1080px tall, H.264, no audio (videos play muted), fast start for streaming
  ffmpeg -loglevel error -i "originals/$f" \
    -vf "scale=-2:'min(1080,ih)'" -c:v libx264 -crf 26 -preset slow \
    -pix_fmt yuv420p -an -movflags +faststart "$f"
  before=$(du -h "originals/$f" | cut -f1); after=$(du -h "$f" | cut -f1)
  echo "ok    $f  $before -> $after"
done

echo
echo "Done. assets/originals/ is ignored by git, so only the small versions get deployed."
