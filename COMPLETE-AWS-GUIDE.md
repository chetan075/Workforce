# 🚀 Complete AWS EC2 Deployment Guide for ChainBill

## 📋 **What We'll Accomplish**
By the end of this guide, you'll have:
- ✅ Fresh EC2 instance with Docker
- ✅ Your ChainBill app running live on AWS
- ✅ Database configured and connected
- ✅ Public URL to access your blockchain application

---

## 🎯 **STEP 1: Create Fresh EC2 Instance**

### 1.1 Launch New EC2 Instance
1. **Login to AWS Console**: https://aws.amazon.com/console/
2. **Navigate to EC2**: Services → EC2 → Instances
3. **Click "Launch Instance"**

### 1.2 Configure Instance
```
✅ Name: chainbill-production
✅ AMI: Ubuntu Server 22.04 LTS (Free tier eligible)
✅ Instance Type: t3.medium (recommended) or t2.micro (free tier)
✅ Key Pair: Create new or use existing
✅ Security Group: Create new with these rules:
   - SSH (22) - Your IP only
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0  
   - Custom TCP (3000) - 0.0.0.0/0 (Frontend)
   - Custom TCP (5000) - 0.0.0.0/0 (Backend API)
✅ Storage: 20 GB gp3
```

### 1.3 Launch and Connect
1. **Click "Launch Instance"**
2. **Wait for Status**: Running + 2/2 status checks
3. **Note Public IP**: Copy your instance's public IP address

---

## 🔌 **STEP 2: Connect to Your EC2 Instance**

### 2.1 Connect via SSH
```bash
# Replace with your key file and public IP
ssh -i "your-key.pem" ubuntu@YOUR_PUBLIC_IP

# If permission denied, fix key permissions:
chmod 400 your-key.pem
```

### 2.2 Update System
```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip
```

---

## 🐳 **STEP 3: Install Docker & Docker Compose**

### 3.1 Install Docker
```bash
# Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### 3.2 Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3.3 Test Docker (Re-login required)
```bash
# Logout and login again for group changes
exit

# SSH back in
ssh -i "your-key.pem" ubuntu@YOUR_PUBLIC_IP

# Test Docker without sudo
docker run hello-world
```

---

## 📦 **STEP 4: Deploy Your Application**

### 4.1 Clone Your Repository
```bash
# Clone your repository
git clone https://github.com/chetan075/Workverse.git
cd Workverse

# Verify files are present
ls -la
```

### 4.2 Configure Environment Variables
```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

**Edit these critical values in `.env.production`:**
```bash
# Database (we'll set up MongoDB Atlas)
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/chainbill

# Your existing blockchain values
APTOS_PRIVATE_KEY=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0
APTOS_CONTRACT_ADDRESS=0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0

# Stripe (if you have keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# OpenAI (if you have key)
OPENAI_API_KEY=sk-your_openai_key

# JWT Secret (generate a secure one)
JWT_SECRET=your-super-secure-32-character-secret

# Application URLs (replace with your EC2 public IP)
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP:3000
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

## 🗄️ **STEP 5: Set Up MongoDB Database**

### Option A: MongoDB Atlas (Recommended - Free)
1. **Go to**: https://www.mongodb.com/atlas
2. **Sign up/Login** and create free cluster
3. **Create database user** with password
4. **Whitelist IP**: Add `0.0.0.0/0` (all IPs) for now
5. **Get connection string**: Replace in `.env.production`

### Option B: Local MongoDB (Alternative)
```bash
# Install MongoDB locally
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Update .env.production
MONGODB_URI=mongodb://localhost:27017/chainbill
```

---

## 🚀 **STEP 6: Build and Run Application**

### 6.1 Make Scripts Executable
```bash
# Make deployment scripts executable
chmod +x deploy-to-aws.sh
chmod +x docker/start.sh
find deployment -name "*.sh" -exec chmod +x {} \;
```

### 6.2 Build Docker Image
```bash
# Build the application
docker build -t chainbill:latest .

# Verify image was created
docker images | grep chainbill
```

### 6.3 Run with Docker Compose
```bash
# Start the application
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

---

## 🌐 **STEP 7: Access Your Live Application**

### 7.1 Test Application
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check if frontend is accessible
curl -I http://localhost:3000
```

### 7.2 Access from Browser
1. **Frontend**: `http://YOUR_EC2_PUBLIC_IP:3000`
2. **Backend API**: `http://YOUR_EC2_PUBLIC_IP:5000`
3. **Health Check**: `http://YOUR_EC2_PUBLIC_IP:5000/health`

### 7.3 Test Blockchain Features
1. **Open frontend** in browser
2. **Connect wallet** (should work with your Aptos integration)
3. **Test NFT minting** functionality
4. **Verify transactions** on Aptos blockchain

---

## 🔧 **STEP 8: Configure Domain (Optional)**

### 8.1 Point Domain to EC2
If you have a domain:
1. **Add A Record**: `your-domain.com` → `YOUR_EC2_PUBLIC_IP`
2. **Add A Record**: `api.your-domain.com` → `YOUR_EC2_PUBLIC_IP`

### 8.2 Update Environment
```bash
# Edit environment for production domain
nano .env.production

# Update CORS_ORIGIN
CORS_ORIGIN=http://your-domain.com

# Restart application
docker-compose down
docker-compose up -d
```

---

## 🔐 **STEP 9: Secure Your Application**

### 9.1 Configure Firewall
```bash
# Install UFW firewall
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5000

# Check status
sudo ufw status
```

### 9.2 Set Up SSL (Optional but Recommended)
```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate (if you have domain)
sudo certbot certonly --standalone -d your-domain.com
```

---

## 📊 **STEP 10: Monitor and Maintain**

### 10.1 Useful Commands
```bash
# Check application status
docker-compose ps

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Update application
git pull
docker-compose down
docker build -t chainbill:latest .
docker-compose up -d

# Check system resources
htop
df -h
```

### 10.2 Backup Strategy
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mongo mongodump --out /backup/mongo_$DATE
tar -czf /home/ubuntu/backup_$DATE.tar.gz /backup/mongo_$DATE
EOF

chmod +x backup.sh
```

---

## 🆘 **Troubleshooting Guide**

### Common Issues & Solutions

#### 1. **Port Already in Use**
```bash
# Kill process on port
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:5000 | xargs kill -9
```

#### 2. **Docker Permission Denied**
```bash
# Add user to docker group and re-login
sudo usermod -aG docker $USER
exit
# SSH back in
```

#### 3. **Application Won't Start**
```bash
# Check logs
docker-compose logs

# Check environment variables
cat .env.production

# Rebuild containers
docker-compose down -v
docker-compose up --build -d
```

#### 4. **Database Connection Failed**
```bash
# Test MongoDB connection
docker-compose exec chainbill-app npm run test:db

# Check MongoDB logs if using local
sudo journalctl -u mongodb
```

#### 5. **Frontend Can't Connect to Backend**
- Verify CORS_ORIGIN in `.env.production`
- Check security group allows port 5000
- Ensure backend is running: `curl http://localhost:5000/health`

---

## ✅ **Final Checklist**

Before going live, verify:
- [ ] EC2 instance is running
- [ ] Docker containers are up (`docker-compose ps`)
- [ ] Frontend accessible at `http://YOUR_IP:3000`
- [ ] Backend API working at `http://YOUR_IP:5000/health`
- [ ] Database connection successful
- [ ] Blockchain wallet connection works
- [ ] NFT minting functionality tested
- [ ] All environment variables configured
- [ ] Security groups properly configured

---

## 🎉 **Success! Your Application is Live**

**Your ChainBill blockchain application is now running on AWS!**

**Access URLs:**
- 🌐 **Frontend**: `http://YOUR_EC2_PUBLIC_IP:3000`
- 🔌 **Backend API**: `http://YOUR_EC2_PUBLIC_IP:5000`
- 🏥 **Health Check**: `http://YOUR_EC2_PUBLIC_IP:5000/health`

**What's Working:**
- ✅ Full-stack application deployed
- ✅ Database connected and operational
- ✅ Blockchain integration with Aptos
- ✅ NFT invoice minting capability
- ✅ Public access via internet

**Next Steps:**
- Share your live application URL
- Test all functionality thoroughly
- Consider setting up a custom domain
- Monitor logs and performance
- Plan for scaling if needed

🚀 **Congratulations! Your blockchain invoice platform is live on AWS!**