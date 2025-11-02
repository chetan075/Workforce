# ChainBill - Dual Database Architecture

## Overview

ChainBill now uses a **dual database architecture** for maximum reliability, performance, and scalability:

- **MySQL (Prisma ORM)**: Primary database for core business logic, transactions, and ACID compliance
- **MongoDB (Mongoose)**: Secondary database for analytics, file metadata, logging, and flexible data storage

Both databases stay perfectly synchronized using automated sync services.

## Architecture Benefits

### MySQL (Primary)
- ✅ **ACID Transactions**: Critical for financial data integrity
- ✅ **Relational Data**: Perfect for user-invoice-project relationships  
- ✅ **Data Consistency**: Ensures blockchain token IDs are never duplicated
- ✅ **Battle-tested**: Reliable for production financial systems

### MongoDB (Secondary)  
- ✅ **High-Performance Analytics**: Complex aggregations for user behavior
- ✅ **Flexible Schema**: Easy to add new analytics fields
- ✅ **File Metadata**: Efficient storage for IPFS file information
- ✅ **Real-time Logging**: Application and blockchain event tracking
- ✅ **Scalability**: Horizontal scaling for growing data

## Database Models

### Core Business Models (Synchronized)
Both databases contain identical copies of these models:

```typescript
// Synchronized between MySQL and MongoDB
- User (profile, wallet, reputation)
- Invoice (amounts, blockchain tokens, status)
- Project (descriptions, budgets, deadlines)  
- Skill (categories, levels, verification)
- Review (ratings, comments, quality scores)
- Dispute (resolution, voting, outcomes)
- StoredFile (IPFS hashes, encryption)
- Reputation (trust scores, performance metrics)
```

### MongoDB-Only Models (Analytics)
```typescript
// Analytics and logging (MongoDB only)
- MongoAnalytics (user events, blockchain activities)
- MongoAppLog (application logs, error tracking)
```

## Environment Setup

### Required Environment Variables

```bash
# MySQL Database (Primary)
DATABASE_URL="mysql://username:password@localhost:3306/chainbill"

# MongoDB Database (Secondary)  
MONGODB_URI="mongodb://localhost:27017/chainbill"
# OR for MongoDB Atlas:
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/chainbill"

# Blockchain Configuration
CONTRACT_ADDRESS="0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0"
APTOS_PRIVATE_KEY="your-aptos-private-key"
APTOS_NETWORK="devnet"
APTOS_STRICT="true"
```

## Database Synchronization

### Automatic Sync (Recommended)
The system automatically syncs data in real-time:

```typescript
// When creating a user in your service:
const user = await this.prisma.user.create({ data: userData });

// Automatically syncs to MongoDB:
await this.syncService.syncUserCreated(user.id);
```

### Manual Sync Methods
```typescript
// Sync specific records
await this.syncService.syncUserCreated(userId);
await this.syncService.syncInvoiceCreated(invoiceId);  
await this.syncService.syncProjectCreated(projectId);

// Perform full sync (initial setup)
await this.syncService.performInitialSync();
```

### Scheduled Sync (Backup)
- **Users**: Synced every hour
- **Invoices**: Synced every 30 minutes  
- **Projects**: Synced every hour

## Analytics & Logging

### Event Tracking
```typescript
// Track user activities
await this.syncService.logUserLogin(userId, userAgent, ipAddress);
await this.syncService.logPaymentReceived(invoiceId, userId, amount);
await this.syncService.logFileUploaded(invoiceId, userId, filename);
await this.syncService.logNFTMinted(invoiceId, tokenId, txHash);
```

### Analytics Queries
```typescript
// Get user activity analytics
const analytics = await this.mongodb.getUserAnalytics(userId, 30); // Last 30 days

// Get system-wide metrics
const metrics = await this.mongodb.getSystemMetrics(7); // Last 7 days
```

## File Storage Integration

### Storing File Metadata
```typescript
// Store file information in MongoDB
await this.mongodb.storeFileMetadata({
  id: fileId,
  invoiceId: invoiceId,
  filename: 'contract.pdf',
  ipfsHash: 'QmXxXxXxXx',
  fileSize: 1024000,
  metadataHash: 'unique-hash',
  encryptedBase64: 'encrypted-content'
});
```

### Retrieving Files
```typescript
// Get all files for an invoice
const files = await this.mongodb.getFilesByInvoice(invoiceId);
```

## Search Capabilities

### MongoDB Text Search
```typescript
// Search users across multiple fields
const users = await this.mongodb.searchUsers('blockchain developer');

// Search projects  
const projects = await this.mongodb.searchProjects('web3 smart contract');
```

## Deployment Options

### Option 1: Render + MongoDB Atlas (Recommended)
**Easy deployment with managed databases**

```yaml
# render.yaml
services:
  - type: web
    name: chainbill-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: DATABASE_URL
        value: mysql://user:pass@mysql.render.com/chainbill
      - key: MONGODB_URI  
        value: mongodb+srv://user:pass@cluster.mongodb.net/chainbill
```

**Setup Steps:**
1. Create Render MySQL database
2. Create MongoDB Atlas cluster (free tier available)
3. Deploy backend to Render
4. Deploy frontend to Vercel/Netlify

### Option 2: AWS EC2 (Full Control)
```bash
# Complete AWS deployment scripts provided in /deploy folder
./deploy/ec2-setup.sh      # Server setup
./deploy/mysql-setup.sh    # MySQL installation  
# MongoDB setup included in main deployment
./deploy/app-deploy.sh     # Application deployment
```

## Health Monitoring

### Database Health Check
```typescript
// Check both database connections
const health = await this.syncService.checkSyncHealth();

// Response:
{
  mysql: { status: 'healthy', recordCount: 1500 },
  mongodb: { status: 'healthy', collections: ['users', 'invoices', ...] }
}
```

### MongoDB Health Endpoint
```bash
GET /api/health/mongodb
# Returns: { status: 'healthy', collections: [...] }
```

## Development Workflow

### 1. Start Development Environment
```bash
# Start MySQL (via Docker or local)
# Start MongoDB (via Docker or local)

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Start backend
npm run start:dev
```

### 2. Initial Database Sync
```bash
# After first run, perform initial sync:
POST /api/sync/initial
```

### 3. Monitor Sync Status
```bash
# Check sync health
GET /api/health/sync

# View recent analytics
GET /api/analytics/system
```

## Production Considerations

### Data Consistency
- MySQL is the **source of truth** for all business logic
- MongoDB sync failures don't affect core functionality  
- Automatic retry mechanisms for failed syncs
- Manual sync endpoints for recovery

### Performance Optimization
- MongoDB indexes on frequently queried fields
- Scheduled cleanup of old analytics data
- Connection pooling for both databases
- Caching layer for read-heavy operations

### Security
- Separate read/write permissions for each database
- Encrypted connections (TLS/SSL)
- Regular security updates and monitoring
- Backup encryption for sensitive data

### Monitoring & Alerts
- Database connection monitoring
- Sync failure alerts
- Performance metric tracking
- Error rate monitoring

## Troubleshooting

### Common Issues

**MongoDB Connection Failed:**
```bash
# Check MongoDB URI format
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/chainbill"

# Verify network access (MongoDB Atlas whitelist)
```

**Sync Failures:**
```bash
# Check sync service logs
docker logs chainbill-backend | grep "Sync"

# Manual sync recovery
POST /api/sync/users
POST /api/sync/invoices
```

**Performance Issues:**
```bash
# Check MongoDB indexes
db.users.getIndexes()

# Monitor connection pools
db.runCommand({serverStatus: 1}).connections
```

### Recovery Procedures

**Full Resync:**
```typescript
// Emergency full resync (use carefully)
await this.syncService.performInitialSync();
```

**Partial Recovery:**
```typescript
// Sync recent data only
await this.syncService.syncAllUsers();    // Last hour
await this.syncService.syncAllInvoices(); // Last 30 minutes
```

## Getting Started

1. **Clone and Install:**
   ```bash
   git clone <repository>
   cd backend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URLs
   ```

3. **Setup Databases:**
   ```bash
   npx prisma migrate dev  # MySQL setup
   # MongoDB connects automatically
   ```

4. **Run Application:**
   ```bash
   npm run start:dev
   ```

5. **Verify Dual Database:**
   ```bash
   GET http://localhost:3000/api/health/sync
   ```

Your ChainBill platform now has enterprise-grade dual database architecture with perfect synchronization between MySQL and MongoDB! 🎆