# 🔧 MongoDB Atlas User Troubleshooting Guide

## 🚨 **User Not Visible Issue - Step by Step Fix**

### **Step 1: Verify You're in the Right Place**

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Check Organization**: Top-left dropdown - make sure you're in the correct organization
3. **Check Project**: Make sure you're in the correct project where your cluster exists

### **Step 2: Check Database Users (Not Organization Users)**

🎯 **IMPORTANT**: You need to create DATABASE USERS, not organization users

1. **Navigate to Database Access**:
   ```
   MongoDB Atlas Dashboard → Database Access (left sidebar)
   ```

2. **Look for your user**: Should show username `user123` based on your connection string

3. **If user doesn't exist, create it**:
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `user123`
   - Password: `80OPB092rULxVZaE`
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

### **Step 3: Verify Network Access**

1. **Go to Network Access**:
   ```
   MongoDB Atlas Dashboard → Network Access (left sidebar)
   ```

2. **Check IP Whitelist**:
   - Should have `0.0.0.0/0` (Allow access from anywhere) for development
   - Or your specific IP address

3. **If not configured**:
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" or add your IP
   - Click "Confirm"

### **Step 4: Test Connection String**

Your current connection string:
```
mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse?retryWrites=true&w=majority
```

**Test it manually**:
```bash
# Install MongoDB client (if not already installed)
npm install -g mongodb

# Test connection
mongosh "mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse"
```

### **Step 5: Common Connection String Issues**

#### **Issue 1: Special Characters in Password**
If your password has special characters, they need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`

#### **Issue 2: Wrong Database Name**
Make sure the database name in the connection string matches your actual database.

#### **Issue 3: Cluster Not Ready**
New clusters can take 5-10 minutes to be fully ready.

## 🔧 **Fix Your MongoDB Atlas Setup**

### **Option 1: Recreate Database User**

1. **Delete existing user** (if any):
   - Database Access → Find user → Delete

2. **Create new user**:
   - Database Access → Add New Database User
   - Authentication Method: Password
   - Username: `chainbill_user`
   - Password: `ChainBill2025!`
   - Privileges: "Read and write to any database"
   - Restrict Access: No restrictions

3. **Update your .env file**:
   ```
   MONGODB_URI="mongodb+srv://chainbill_user:ChainBill2025!@workverse.qohwaws.mongodb.net/chainbill?retryWrites=true&w=majority"
   ```

### **Option 2: Use Built-in Users**

If you're still having issues, check if there are any pre-existing users:

1. **Database Access → View existing users**
2. **Note any existing usernames**
3. **Use those credentials in your connection string**

## 🧪 **Test Your Connection**

### **Method 1: Using Node.js**
```javascript
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas!");
    
    // List databases
    const dbs = await client.db().admin().listDatabases();
    console.log("📋 Available databases:", dbs.databases.map(db => db.name));
    
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.close();
  }
}

testConnection();
```

### **Method 2: Using Your Backend**
```bash
# In your backend directory
cd backend
npm install
npm run start:dev

# Check logs for MongoDB connection status
```

## 🔍 **Check Current Configuration**

Your current MongoDB setup:
- **Connection String**: `mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse`
- **Username**: `user123`
- **Password**: `80OPB092rULxVZaE`
- **Database**: `workverse`
- **Cluster**: `workverse.qohwaws.mongodb.net`

## 🚨 **Emergency Solution: Create New MongoDB Setup**

If nothing works, create a fresh setup:

### **Step 1: Create New Cluster**
1. MongoDB Atlas → Create new cluster
2. Choose free tier (M0)
3. Name: `chainbill-cluster`

### **Step 2: Create Database User**
1. Database Access → Add New Database User
2. Username: `chainbill_admin`
3. Password: `SecurePass123!`
4. Privileges: "Read and write to any database"

### **Step 3: Update Environment**
```env
MONGODB_URI="mongodb+srv://chainbill_admin:SecurePass123!@chainbill-cluster.xxxxx.mongodb.net/chainbill?retryWrites=true&w=majority"
```

## 🎯 **What to Do Right Now**

1. **Go to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Navigate to**: Database Access (left sidebar)
3. **Check if `user123` exists**
4. **If not, create it with the exact credentials from your .env**
5. **Test connection using the Node.js script above**

## 📞 **Still Having Issues?**

If you're still having problems:
1. **Screenshot your Database Access page**
2. **Check the exact error message when connecting**
3. **Verify your cluster status** (should be "Active")
4. **Make sure billing is set up** (even for free tier)

---

**Let me know what you see in your Database Access section, and I'll help you fix it!**