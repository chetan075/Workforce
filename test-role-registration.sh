#!/bin/bash

# Test Role Registration Script
echo "🧪 Testing Role Registration"
echo "=========================="

BASE_URL="http://localhost:5000"

# Test 1: Register as CLIENT (someone who wants to hire freelancers)
echo "📝 Test 1: Registering as CLIENT (Hire Freelancers)"
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "password123",
    "name": "Test Client",
    "role": "CLIENT"
  }' | jq '.'

echo ""
echo "⏳ Waiting 2 seconds..."
sleep 2

# Test 2: Register as FREELANCER (someone who wants to work)
echo "📝 Test 2: Registering as FREELANCER (Work as Freelancer)" 
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "freelancer@test.com", 
    "password": "password123",
    "name": "Test Freelancer",
    "role": "FREELANCER"
  }' | jq '.'

echo ""
echo "✅ Registration tests completed!"
echo "📊 Check your backend logs to see the role debugging information"
echo "🗄️ Check both MySQL and MongoDB to verify the roles are correctly saved"