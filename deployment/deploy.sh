#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="chainbill"
ECS_CLUSTER="chainbill-cluster"
ECS_SERVICE="chainbill-service"
AWS_ACCOUNT_ID="YOUR_ACCOUNT_ID"

echo "🚀 Starting AWS ECS Deployment for ChainBill..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $AWS_ACCOUNT_ID"

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t chainbill:latest .

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push image
echo "📤 Pushing image to ECR..."
docker tag chainbill:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Update task definition with correct account ID
echo "📝 Updating task definition..."
sed "s/YOUR_ACCOUNT/$AWS_ACCOUNT_ID/g" deployment/ecs-task-definition.json > deployment/ecs-task-definition-updated.json

# Register new task definition
echo "📋 Registering new task definition..."
aws ecs register-task-definition --cli-input-json file://deployment/ecs-task-definition-updated.json --region $AWS_REGION

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION

echo "✅ Deployment completed successfully!"
echo "🌐 Your application will be available once the deployment finishes."
echo "📊 Monitor deployment: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$ECS_CLUSTER/services"