#!/bin/bash
set -e

# ChainBill Quick Deployment Script
echo "🚀 ChainBill Quick Deployment to AWS"
echo "======================================"

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $AWS_ACCOUNT_ID"

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
PROJECT_NAME="chainbill"

echo "📍 Region: $AWS_REGION"
echo "📦 Project: $PROJECT_NAME"

# Make scripts executable
chmod +x deployment/*.sh

# Step 1: Infrastructure
echo ""
echo "🏗️ Step 1: Setting up AWS infrastructure..."
if [ ! -f "deployment/infrastructure-config.json" ]; then
    echo "Creating VPC, subnets, load balancer..."
    ./deployment/setup-infrastructure.sh
else
    echo "✅ Infrastructure already exists"
fi

# Step 2: Database
echo ""
echo "🗄️ Step 2: Setting up database..."
if [ ! -f "deployment/database-config.json" ]; then
    echo "Creating RDS PostgreSQL instance..."
    ./deployment/setup-database.sh
else
    echo "✅ Database already exists"
fi

# Step 3: Build and Deploy
echo ""
echo "🐳 Step 3: Building and deploying application..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "⚠️  .env.production not found. Copying from example..."
    cp .env.production.example .env.production
    echo "📝 Please edit .env.production with your actual values!"
    echo "Press Enter to continue after editing..."
    read
fi

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t chainbill:latest .

# Deploy to ECR and ECS
echo "🚀 Deploying to AWS..."
./deployment/deploy.sh

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 30

# Get load balancer URL
ALB_DNS=$(aws elbv2 describe-load-balancers \
    --names chainbill-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text \
    --region $AWS_REGION 2>/dev/null || echo "Load balancer not ready yet")

echo ""
echo "🎉 Deployment completed!"
echo "======================================"
echo "📊 Check deployment status:"
echo "   aws ecs describe-services --cluster chainbill-cluster --services chainbill-service"
echo ""
echo "📋 View logs:"
echo "   aws logs tail /ecs/chainbill --follow"
echo ""
if [ "$ALB_DNS" != "Load balancer not ready yet" ]; then
    echo "🌐 Application URLs:"
    echo "   Frontend: http://$ALB_DNS"
    echo "   Backend:  http://$ALB_DNS:5000"
    echo "   Health:   http://$ALB_DNS:5000/health"
else
    echo "⏳ Load balancer DNS not ready yet. Check in a few minutes."
fi
echo ""
echo "🔧 AWS Console:"
echo "   https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/chainbill-cluster"
echo ""
echo "🚀 Your ChainBill blockchain application is now live on AWS!"