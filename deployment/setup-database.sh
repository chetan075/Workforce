#!/bin/bash
set -e

# RDS PostgreSQL Setup for ChainBill
AWS_REGION="us-east-1"
PROJECT_NAME="chainbill"
DB_NAME="chainbill"
DB_USERNAME="chainbill_user"
DB_PASSWORD="ChainBill2025SecurePassword!"

echo "🗄️ Setting up RDS PostgreSQL database..."

# Read infrastructure config
if [ ! -f "deployment/infrastructure-config.json" ]; then
    echo "❌ Infrastructure config not found. Run setup-infrastructure.sh first."
    exit 1
fi

VPC_ID=$(cat deployment/infrastructure-config.json | grep -o '"vpc_id": "[^"]*' | grep -o '[^"]*$')
PRIVATE_SUBNET_1=$(cat deployment/infrastructure-config.json | grep -o '"private_subnet_1": "[^"]*' | grep -o '[^"]*$')
PRIVATE_SUBNET_2=$(cat deployment/infrastructure-config.json | grep -o '"private_subnet_2": "[^"]*' | grep -o '[^"]*$')

# Create DB Subnet Group
echo "🏠 Creating DB subnet group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name "$PROJECT_NAME-db-subnet-group" \
    --db-subnet-group-description "Subnet group for ChainBill database" \
    --subnet-ids $PRIVATE_SUBNET_1 $PRIVATE_SUBNET_2 \
    --region $AWS_REGION

# Create DB Security Group
echo "🔐 Creating database security group..."
DB_SG_ID=$(aws ec2 create-security-group \
    --group-name "$PROJECT_NAME-db-sg" \
    --description "Security group for ChainBill database" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text \
    --region $AWS_REGION)

# Allow PostgreSQL access from application security group
APP_SG_ID=$(cat deployment/infrastructure-config.json | grep -o '"security_group_id": "[^"]*' | grep -o '[^"]*$')
aws ec2 authorize-security-group-ingress \
    --group-id $DB_SG_ID \
    --protocol tcp \
    --port 5432 \
    --source-group $APP_SG_ID \
    --region $AWS_REGION

echo "✅ Database security group created: $DB_SG_ID"

# Create RDS Instance
echo "🚀 Creating RDS PostgreSQL instance..."
aws rds create-db-instance \
    --db-instance-identifier "$PROJECT_NAME-db" \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username $DB_USERNAME \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --storage-type gp2 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $DB_SG_ID \
    --db-subnet-group-name "$PROJECT_NAME-db-subnet-group" \
    --backup-retention-period 7 \
    --multi-az \
    --no-publicly-accessible \
    --region $AWS_REGION

echo "⏳ Waiting for database to be available..."
aws rds wait db-instance-available --db-instance-identifier "$PROJECT_NAME-db" --region $AWS_REGION

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "$PROJECT_NAME-db" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region $AWS_REGION)

echo "✅ Database created successfully!"
echo "🔗 Database endpoint: $DB_ENDPOINT"

# Create Secrets Manager secrets
echo "🔐 Creating secrets in AWS Secrets Manager..."

# Database URL secret
DATABASE_URL="postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_ENDPOINT:5432/$DB_NAME"
aws secretsmanager create-secret \
    --name "chainbill/database-url" \
    --description "ChainBill database connection URL" \
    --secret-string "$DATABASE_URL" \
    --region $AWS_REGION

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
aws secretsmanager create-secret \
    --name "chainbill/jwt-secret" \
    --description "ChainBill JWT secret" \
    --secret-string "$JWT_SECRET" \
    --region $AWS_REGION

echo "✅ Secrets created in AWS Secrets Manager"

# Update infrastructure config
echo "💾 Updating infrastructure configuration..."
cat > deployment/database-config.json << EOF
{
  "db_instance_identifier": "$PROJECT_NAME-db",
  "db_endpoint": "$DB_ENDPOINT",
  "db_name": "$DB_NAME",
  "db_username": "$DB_USERNAME",
  "db_security_group": "$DB_SG_ID",
  "database_url": "$DATABASE_URL"
}
EOF

echo "🎉 Database setup completed!"
echo "📊 Database configuration saved to deployment/database-config.json"
echo "🔗 Database URL: $DATABASE_URL"