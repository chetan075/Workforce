# 🚀 AWS Deployment Guide for ChainBill

This guide will help you deploy your ChainBill application to AWS using Docker containers with ECS Fargate.

## 📋 **Prerequisites**

1. **AWS CLI configured** with appropriate permissions
2. **Docker installed** and running
3. **Git repository** with your code
4. **Environment variables** configured

### Required AWS Permissions
Your AWS user/role needs permissions for:
- ECR (Elastic Container Registry)
- ECS (Elastic Container Service)
- VPC, EC2, Security Groups
- RDS (PostgreSQL)
- Secrets Manager
- Application Load Balancer
- CloudWatch Logs

## 🛠️ **Step 1: Configure AWS CLI**

```bash
# Configure AWS CLI
aws configure

# Verify configuration
aws sts get-caller-identity
```

## 🏗️ **Step 2: Set Up Infrastructure**

### Create VPC and Network Components
```bash
# Make scripts executable
chmod +x deployment/*.sh

# Set up VPC, subnets, security groups, load balancer
./deployment/setup-infrastructure.sh
```

This creates:
- ✅ VPC with public/private subnets
- ✅ Internet Gateway and route tables
- ✅ Security groups for app and database
- ✅ Application Load Balancer
- ✅ ECS cluster

### Set Up Database
```bash
# Create RDS PostgreSQL instance
./deployment/setup-database.sh
```

This creates:
- ✅ RDS PostgreSQL instance in private subnets
- ✅ Database security group
- ✅ AWS Secrets Manager secrets
- ✅ Database connection configuration

## 🐳 **Step 3: Build and Deploy Application**

### Configure Environment Variables
```bash
# Copy and edit environment file
cp .env.production.example .env.production

# Edit with your actual values
nano .env.production
```

### Build and Push Docker Image
```bash
# Build the Docker image
docker build -t chainbill:latest .

# Test locally (optional)
docker-compose up -d

# Deploy to AWS
./deployment/deploy.sh
```

## 🔧 **Step 4: Update ECS Task Definition**

Update the account ID in your task definition:
```bash
# Your AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Update task definition
sed "s/YOUR_ACCOUNT/$AWS_ACCOUNT_ID/g" deployment/ecs-task-definition.json > deployment/ecs-task-definition-updated.json
```

## 🚀 **Step 5: Create ECS Service**

```bash
# Read infrastructure configuration
source deployment/infrastructure-config.json

# Create ECS service
aws ecs create-service \
    --cluster chainbill-cluster \
    --service-name chainbill-service \
    --task-definition chainbill-task \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$PUBLIC_SUBNET_1,$PUBLIC_SUBNET_2],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$FRONTEND_TARGET_GROUP,containerName=chainbill-app,containerPort=3000" \
    --region us-east-1
```

## 🔐 **Step 6: Configure Secrets**

Add your secrets to AWS Secrets Manager:

```bash
# Blockchain secrets
aws secretsmanager create-secret \
    --name "chainbill/aptos-private-key" \
    --secret-string "YOUR_APTOS_PRIVATE_KEY"

# Stripe secrets
aws secretsmanager create-secret \
    --name "chainbill/stripe-secret-key" \
    --secret-string "YOUR_STRIPE_SECRET_KEY"

# OpenAI secret
aws secretsmanager create-secret \
    --name "chainbill/openai-api-key" \
    --secret-string "YOUR_OPENAI_API_KEY"

# MongoDB URI
aws secretsmanager create-secret \
    --name "chainbill/mongodb-uri" \
    --secret-string "YOUR_MONGODB_URI"
```

## 📊 **Step 7: Monitor Deployment**

### Check ECS Service Status
```bash
aws ecs describe-services \
    --cluster chainbill-cluster \
    --services chainbill-service
```

### View Application Logs
```bash
aws logs tail /ecs/chainbill --follow
```

### Get Load Balancer URL
```bash
aws elbv2 describe-load-balancers \
    --names chainbill-alb \
    --query 'LoadBalancers[0].DNSName' \
    --output text
```

## 🌐 **Step 8: Access Your Application**

Once deployed, your application will be available at:
- **Frontend**: `http://your-load-balancer-dns.amazonaws.com`
- **Backend API**: `http://your-load-balancer-dns.amazonaws.com:5000`

## 🔄 **Step 9: Updates and Maintenance**

### Deploy New Version
```bash
# Build new image
docker build -t chainbill:latest .

# Push to ECR
./deployment/deploy.sh

# Force new deployment
aws ecs update-service \
    --cluster chainbill-cluster \
    --service chainbill-service \
    --force-new-deployment
```

### Scale Application
```bash
# Scale to 3 instances
aws ecs update-service \
    --cluster chainbill-cluster \
    --service chainbill-service \
    --desired-count 3
```

## 🗑️ **Step 10: Cleanup (if needed)**

```bash
# Delete ECS service
aws ecs update-service \
    --cluster chainbill-cluster \
    --service chainbill-service \
    --desired-count 0

aws ecs delete-service \
    --cluster chainbill-cluster \
    --service chainbill-service

# Delete other resources
aws ecs delete-cluster --cluster chainbill-cluster
aws rds delete-db-instance --db-instance-identifier chainbill-db --skip-final-snapshot
# ... (delete other resources as needed)
```

## 🆘 **Troubleshooting**

### Common Issues

1. **Task fails to start**
   - Check CloudWatch logs: `/ecs/chainbill`
   - Verify secrets are correctly configured
   - Check security group rules

2. **Database connection failed**
   - Verify RDS instance is in correct subnets
   - Check security group allows port 5432
   - Verify database URL in secrets

3. **Load balancer health check fails**
   - Check if application starts properly
   - Verify health check endpoint `/health`
   - Check target group configuration

### Useful Commands

```bash
# Check ECS tasks
aws ecs list-tasks --cluster chainbill-cluster

# Describe specific task
aws ecs describe-tasks --cluster chainbill-cluster --tasks TASK_ARN

# View recent logs
aws logs tail /ecs/chainbill --since 1h

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
```

## 📈 **Production Considerations**

1. **SSL/TLS**: Configure HTTPS with ACM certificates
2. **Domain**: Set up Route 53 for custom domain
3. **Monitoring**: Set up CloudWatch alarms
4. **Backup**: Configure automated RDS backups
5. **CDN**: Use CloudFront for static assets
6. **Security**: Enable VPC Flow Logs, AWS Config

---

🎉 **Congratulations!** Your ChainBill application is now running on AWS with full blockchain integration!