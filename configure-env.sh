#!/bin/bash

# ChainBill Environment Configuration Helper
echo "🔧 ChainBill Environment Configuration"
echo "======================================"

# Get EC2 public IP automatically
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")

if [ "$PUBLIC_IP" = "YOUR_EC2_PUBLIC_IP" ]; then
    echo "⚠️  Could not detect EC2 public IP automatically"
    echo "Please enter your EC2 public IP address:"
    read -p "EC2 Public IP: " PUBLIC_IP
fi

echo "📍 Using EC2 Public IP: $PUBLIC_IP"

# Create .env.production file
cat > .env.production << EOF
# Production Environment Variables for ChainBill
# Generated on $(date)

# Database Configuration
DATABASE_URL=postgresql://chainbill_user:ChainBill2025Password@localhost:5432/chainbill
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=chainbill
DATABASE_USER=chainbill_user
DATABASE_PASSWORD=ChainBill2025Password

# MongoDB Configuration (UPDATE WITH YOUR MONGODB ATLAS URI)
MONGODB_URI=mongodb://localhost:27017/chainbill

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRATION=7d

# Blockchain Configuration (Your existing values)
APTOS_PRIVATE_KEY=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0
APTOS_CONTRACT_ADDRESS=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0
APTOS_NETWORK=devnet

# Payment Configuration (ADD YOUR STRIPE KEYS)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI Configuration (ADD YOUR OPENAI KEY)
OPENAI_API_KEY=sk-your_openai_api_key

# Application Configuration
NODE_ENV=production
PORT=5000
FRONTEND_PORT=3000
CORS_ORIGIN=http://$PUBLIC_IP:3000

# Redis Configuration
REDIS_URL=redis://redis:6379

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=$(openssl rand -base64 32)

# Logging
LOG_LEVEL=info
ENABLE_LOGGING=true
EOF

echo "✅ Environment file created: .env.production"
echo ""
echo "🔧 IMPORTANT: Edit the following values in .env.production:"
echo "   - MONGODB_URI (if using MongoDB Atlas)"
echo "   - STRIPE_SECRET_KEY (if you have Stripe account)"
echo "   - STRIPE_PUBLISHABLE_KEY (if you have Stripe account)"
echo "   - OPENAI_API_KEY (if you have OpenAI account)"
echo ""
echo "📝 To edit: nano .env.production"
echo ""
echo "🚀 After editing, run: docker-compose up -d"