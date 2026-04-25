#!/bin/bash
# Ночной ребилд Next.js — запускать через cron в 3:00
# Cron: 0 3 * * * /srv/scout/scoute-web/scripts/nightly-build.sh >> /var/log/scoute-nightly.log 2>&1

set -e

APP_DIR="/srv/scout/scoute-web"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX Starting nightly build..."

cd "$APP_DIR"

# 1. Pull latest code
echo "$LOG_PREFIX Pulling latest code..."
git pull origin main --ff-only || {
    echo "$LOG_PREFIX WARNING: git pull failed, building with current code"
}

# 2. Install deps if needed
if [ package.json -nt node_modules/.package-lock.json ] 2>/dev/null; then
    echo "$LOG_PREFIX Installing dependencies..."
    npm ci --production=false
fi

# 3. Build (pre-renders all static pages including POI)
echo "$LOG_PREFIX Building Next.js (SSG)..."
npm run build

# 4. Restart PM2
echo "$LOG_PREFIX Restarting PM2 process..."
pm2 restart scoute-next || pm2 start npm --name scoute-next -- start

echo "$LOG_PREFIX Nightly build complete!"
echo "$LOG_PREFIX Checking build output..."
ls -la "$APP_DIR/.next/static/" | head -5

# 5. Log stats
PAGES=$(find "$APP_DIR/.next/server/app" -name "*.html" 2>/dev/null | wc -l)
echo "$LOG_PREFIX Total pre-rendered pages: $PAGES"
