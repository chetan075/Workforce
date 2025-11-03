# ✅ AWS Deployment Checklist for ChainBill

## 📋 Pre-Deployment Checklist

### 🔧 **Local Setup**
- [ ] Docker installed and running
- [ ] AWS CLI installed and configured
- [ ] Git repository up to date
- [ ] Node.js 18+ installed
- [ ] All environment variables ready

### 🔐 **AWS Prerequisites**
- [ ] AWS account with appropriate permissions
- [ ] AWS CLI configured (`aws configure`)
- [ ] Verified AWS identity (`aws sts get-caller-identity`)
- [ ] Selected target region (default: us-east-1)

### 🌐 **External Services**
- [ ] MongoDB Atlas database URL
- [ ] Stripe API keys (secret and publishable)
- [ ] OpenAI API key
- [ ] Aptos private key and contract address

## 🚀 Quick Deployment Steps

### **Option 1: One-Click Deployment**
```bash
# Make script executable
chmod +x deploy-to-aws.sh

# Run complete deployment
./deploy-to-aws.sh
```

### **Option 2: Step-by-Step Deployment**

#### Step 1: Infrastructure Setup
```bash
chmod +x deployment/setup-infrastructure.sh
./deployment/setup-infrastructure.sh
```

#### Step 2: Database Setup
```bash
chmod +x deployment/setup-database.sh
./deployment/setup-database.sh
```

#### Step 3: Configure Secrets
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

#### Step 4: Deploy Application
```bash
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

## 🔧 **Environment Variables Required**

### **Database**
```bash
DATABASE_URL=postgresql://user:pass@endpoint:5432/chainbill
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/chainbill
```

### **Blockchain**
```bash
APTOS_PRIVATE_KEY=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0
APTOS_CONTRACT_ADDRESS=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0
```

### **Payment & AI**
```bash
STRIPE_SECRET_KEY=sk_live_...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secure-32-char-secret
```

## 📊 **Deployment Verification**

### ✅ **Check Infrastructure**
```bash
# Verify VPC and subnets
aws ec2 describe-vpcs --filters "Name=tag:Name,Values=chainbill-vpc"

# Check load balancer
aws elbv2 describe-load-balancers --names chainbill-alb
```

### ✅ **Check Database**
```bash
# Verify RDS instance
aws rds describe-db-instances --db-instance-identifier chainbill-db
```

### ✅ **Check Application**
```bash
# Check ECS service
aws ecs describe-services --cluster chainbill-cluster --services chainbill-service

# View application logs
aws logs tail /ecs/chainbill --follow

# Test health endpoint
curl http://your-load-balancer-dns:5000/health
```

## 🌐 **Access Your Application**

After successful deployment:

- **Frontend**: `http://your-load-balancer-dns.amazonaws.com`
- **Backend API**: `http://your-load-balancer-dns.amazonaws.com:5000`
- **Health Check**: `http://your-load-balancer-dns.amazonaws.com:5000/health`
- **AWS Console**: [ECS Clusters](https://console.aws.amazon.com/ecs/home?region=us-east-1#/clusters)

## 🔄 **Post-Deployment Tasks**

### 🔐 **Security Hardening**
- [ ] Configure HTTPS with SSL certificate
- [ ] Set up custom domain with Route 53
- [ ] Enable VPC Flow Logs
- [ ] Configure CloudWatch alarms

### 📊 **Monitoring Setup**
- [ ] Set up CloudWatch dashboards
- [ ] Configure log retention policies
- [ ] Set up billing alerts
- [ ] Configure backup schedules

### 🚀 **Performance Optimization**
- [ ] Configure auto-scaling policies
- [ ] Set up CloudFront CDN
- [ ] Optimize database performance
- [ ] Enable connection pooling

## 🆘 **Troubleshooting**

### **Common Issues**
1. **Permission Denied**: Ensure AWS user has necessary permissions
2. **Docker Build Fails**: Check Dockerfile and dependencies
3. **Database Connection**: Verify security groups and subnets
4. **Load Balancer Health Check**: Check application startup logs

### **Useful Commands**
```bash
# Check running tasks
aws ecs list-tasks --cluster chainbill-cluster

# View task details
aws ecs describe-tasks --cluster chainbill-cluster --tasks TASK_ARN

# Restart service
aws ecs update-service --cluster chainbill-cluster --service chainbill-service --force-new-deployment

# Scale service
aws ecs update-service --cluster chainbill-cluster --service chainbill-service --desired-count 3
```

## 💰 **Cost Estimation**

**Monthly AWS costs (estimated):**
- ECS Fargate (2 tasks): ~$30-50
- RDS PostgreSQL (db.t3.micro): ~$15-25
- Application Load Balancer: ~$20
- NAT Gateway: ~$45
- **Total**: ~$110-140/month

---

🎉 **Ready to deploy?** Run `./deploy-to-aws.sh` to get started!