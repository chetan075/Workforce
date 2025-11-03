#!/bin/bash
set -e

# AWS Infrastructure Setup for ChainBill
AWS_REGION="us-east-1"
PROJECT_NAME="chainbill"
VPC_CIDR="10.0.0.0/16"

echo "🏗️ Setting up AWS infrastructure for ChainBill..."

# Create VPC
echo "🌐 Creating VPC..."
VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --query 'Vpc.VpcId' --output text --region $AWS_REGION)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value="$PROJECT_NAME-vpc" --region $AWS_REGION
echo "✅ VPC created: $VPC_ID"

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames --region $AWS_REGION

# Create Internet Gateway
echo "🌍 Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text --region $AWS_REGION)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID --region $AWS_REGION
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value="$PROJECT_NAME-igw" --region $AWS_REGION
echo "✅ Internet Gateway created: $IGW_ID"

# Create Public Subnets
echo "🏠 Creating public subnets..."
PUBLIC_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone "${AWS_REGION}a" --query 'Subnet.SubnetId' --output text --region $AWS_REGION)
PUBLIC_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone "${AWS_REGION}b" --query 'Subnet.SubnetId' --output text --region $AWS_REGION)

aws ec2 create-tags --resources $PUBLIC_SUBNET_1 --tags Key=Name,Value="$PROJECT_NAME-public-subnet-1" --region $AWS_REGION
aws ec2 create-tags --resources $PUBLIC_SUBNET_2 --tags Key=Name,Value="$PROJECT_NAME-public-subnet-2" --region $AWS_REGION

# Enable auto-assign public IP
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_1 --map-public-ip-on-launch --region $AWS_REGION
aws ec2 modify-subnet-attribute --subnet-id $PUBLIC_SUBNET_2 --map-public-ip-on-launch --region $AWS_REGION

echo "✅ Public subnets created: $PUBLIC_SUBNET_1, $PUBLIC_SUBNET_2"

# Create Private Subnets
echo "🔒 Creating private subnets..."
PRIVATE_SUBNET_1=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.3.0/24 --availability-zone "${AWS_REGION}a" --query 'Subnet.SubnetId' --output text --region $AWS_REGION)
PRIVATE_SUBNET_2=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.4.0/24 --availability-zone "${AWS_REGION}b" --query 'Subnet.SubnetId' --output text --region $AWS_REGION)

aws ec2 create-tags --resources $PRIVATE_SUBNET_1 --tags Key=Name,Value="$PROJECT_NAME-private-subnet-1" --region $AWS_REGION
aws ec2 create-tags --resources $PRIVATE_SUBNET_2 --tags Key=Name,Value="$PROJECT_NAME-private-subnet-2" --region $AWS_REGION

echo "✅ Private subnets created: $PRIVATE_SUBNET_1, $PRIVATE_SUBNET_2"

# Create Route Table for Public Subnets
echo "🛣️ Creating route tables..."
PUBLIC_RT=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text --region $AWS_REGION)
aws ec2 create-tags --resources $PUBLIC_RT --tags Key=Name,Value="$PROJECT_NAME-public-rt" --region $AWS_REGION

# Add route to Internet Gateway
aws ec2 create-route --route-table-id $PUBLIC_RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID --region $AWS_REGION

# Associate public subnets with route table
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_1 --route-table-id $PUBLIC_RT --region $AWS_REGION
aws ec2 associate-route-table --subnet-id $PUBLIC_SUBNET_2 --route-table-id $PUBLIC_RT --region $AWS_REGION

echo "✅ Route tables configured"

# Create Security Group
echo "🔐 Creating security groups..."
SG_ID=$(aws ec2 create-security-group \
    --group-name "$PROJECT_NAME-sg" \
    --description "Security group for ChainBill application" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region $AWS_REGION)

aws ec2 create-tags --resources $SG_ID --tags Key=Name,Value="$PROJECT_NAME-sg" --region $AWS_REGION

# Add security group rules
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 3000 --cidr 0.0.0.0/0 --region $AWS_REGION
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5000 --cidr 0.0.0.0/0 --region $AWS_REGION

echo "✅ Security group created: $SG_ID"

# Create ECS Cluster
echo "🐳 Creating ECS cluster..."
aws ecs create-cluster --cluster-name "$PROJECT_NAME-cluster" --region $AWS_REGION
echo "✅ ECS cluster created"

# Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "$PROJECT_NAME-alb" \
    --subnets $PUBLIC_SUBNET_1 $PUBLIC_SUBNET_2 \
    --security-groups $SG_ID \
    --region $AWS_REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

echo "✅ Load Balancer created: $ALB_ARN"

# Create Target Groups
echo "🎯 Creating target groups..."
TG_FRONTEND=$(aws elbv2 create-target-group \
    --name "$PROJECT_NAME-frontend-tg" \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path "/" \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

TG_BACKEND=$(aws elbv2 create-target-group \
    --name "$PROJECT_NAME-backend-tg" \
    --protocol HTTP \
    --port 5000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path "/health" \
    --region $AWS_REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

echo "✅ Target groups created"

# Create Load Balancer Listeners
echo "👂 Creating load balancer listeners..."
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_FRONTEND \
    --region $AWS_REGION

aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 5000 \
    --default-actions Type=forward,TargetGroupArn=$TG_BACKEND \
    --region $AWS_REGION

echo "✅ Load balancer listeners created"

# Save configuration
echo "💾 Saving infrastructure configuration..."
cat > deployment/infrastructure-config.json << EOF
{
  "vpc_id": "$VPC_ID",
  "public_subnet_1": "$PUBLIC_SUBNET_1",
  "public_subnet_2": "$PUBLIC_SUBNET_2",
  "private_subnet_1": "$PRIVATE_SUBNET_1",
  "private_subnet_2": "$PRIVATE_SUBNET_2",
  "security_group_id": "$SG_ID",
  "load_balancer_arn": "$ALB_ARN",
  "frontend_target_group": "$TG_FRONTEND",
  "backend_target_group": "$TG_BACKEND",
  "region": "$AWS_REGION"
}
EOF

echo "🎉 AWS infrastructure setup completed!"
echo "📊 Infrastructure details saved to deployment/infrastructure-config.json"
echo "🌐 Load Balancer DNS will be available in a few minutes"