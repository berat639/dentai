#!/bin/bash
# DentAI Server Setup Script
# Run this via your hosting provider's web console (panel)
# Usage: curl -sSL https://raw.githubusercontent.com/berat639/dentai/main/scripts/setup-server.sh | bash

set -e

echo "=== DentAI Server Setup ==="

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | bash
apt install -y docker-compose-plugin

# Install Git
apt install -y git

# Create app directory
mkdir -p /opt/dentai
cd /opt/dentai

# Clone repo
git clone https://github.com/berat639/dentai.git .

# Create .env file
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dentai"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
JWT_SECRET="CHANGE_THIS_TO_RANDOM_STRING"
ENVEOF

echo ""
echo "⚠️  IMPORTANT: Edit /opt/dentai/.env with your actual API keys!"
echo ""

# Start PostgreSQL with Docker
docker compose up -d

# Wait for postgres to be ready
sleep 5

# Install dependencies
npm install

# Generate Prisma client & push schema
npx prisma generate
npx prisma db push

# Seed database
npm run db:seed

# Build the app
npm run build

# Setup Nginx reverse proxy
cat > /etc/nginx/sites-available/dentai << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/dentai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Start app with PM2
pm2 start npm --name "dentai" -- start
pm2 save
pm2 startup

echo ""
echo "=== Setup Complete ==="
echo "App running at: http://$(curl -s ifconfig.me)"
echo ""
echo "Next steps:"
echo "1. Edit /opt/dentai/.env with your real API keys"
echo "2. Run: cd /opt/dentai && pm2 restart dentai"
echo "3. (Optional) Setup SSL with: apt install certbot python3-certbot-nginx && certbot --nginx"
