#!/bin/bash
set -e

# ChainBill EC2 Quick Setup Script
echo "🚀 ChainBill EC2 Quick Setup"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running on Ubuntu
if [[ ! -f /etc/lsb-release ]]; then
    print_error "This script is designed for Ubuntu. Please run on Ubuntu 20.04 or 22.04"
    exit 1
fi

print_step "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip htop nano

print_step "2. Installing Docker..."
# Remove old Docker versions
sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

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

print_step "3. Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

print_step "4. Installing Node.js (for development)..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

print_step "5. Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw allow 5000

print_step "6. Creating application directory..."
cd /home/ubuntu
if [ ! -d "chainbill" ]; then
    mkdir -p chainbill
fi

print_status "✅ Base system setup completed!"
print_warning "⚠️  You need to LOGOUT and LOGIN again for Docker permissions to take effect"

echo ""
echo "🔄 Next Steps:"
echo "1. Logout: exit"
echo "2. SSH back in to your EC2 instance"
echo "3. Run: cd chainbill"
echo "4. Clone your repository: git clone https://github.com/chetan075/Workverse.git"
echo "5. Follow the deployment guide: COMPLETE-AWS-GUIDE.md"

echo ""
print_status "🎉 Setup completed! Ready for application deployment."