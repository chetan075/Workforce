const { MongoClient } = require('mongodb');

// Your MongoDB connection string from .env
const uri = "mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse?retryWrites=true&w=majority";

async function testMongoDBConnection() {
  console.log("🔍 Testing MongoDB Atlas Connection...");
  console.log("=====================================");
  
  const client = new MongoClient(uri);
  
  try {
    console.log("⏳ Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB Atlas!");
    
    // Test database access
    const db = client.db('workverse');
    console.log("📊 Connected to database: workverse");
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log("📋 Collections in database:", collections.map(c => c.name));
    
    // Test write operation
    try {
      const testCollection = db.collection('test');
      const result = await testCollection.insertOne({ 
        test: true, 
        timestamp: new Date(),
        message: "Connection test successful"
      });
      console.log("✅ Write test successful. Document ID:", result.insertedId);
      
      // Clean up test document
      await testCollection.deleteOne({ _id: result.insertedId });
      console.log("🧹 Test document cleaned up");
      
    } catch (writeError) {
      console.error("❌ Write test failed:", writeError.message);
    }
    
    // Get database stats
    const stats = await db.stats();
    console.log("📈 Database stats:");
    console.log("   - Collections:", stats.collections);
    console.log("   - Data Size:", Math.round(stats.dataSize / 1024), "KB");
    
  } catch (error) {
    console.error("❌ Connection failed!");
    console.error("Error details:", error.message);
    
    if (error.message.includes("authentication failed")) {
      console.log("\n🔐 Authentication Issue:");
      console.log("   - Check username and password in MongoDB Atlas");
      console.log("   - Verify user exists in Database Access section");
      console.log("   - Ensure user has 'Read and write to any database' privileges");
    }
    
    if (error.message.includes("connection")) {
      console.log("\n🌐 Network Issue:");
      console.log("   - Check Network Access in MongoDB Atlas");
      console.log("   - Ensure 0.0.0.0/0 is whitelisted or add your IP");
      console.log("   - Verify cluster is running (not paused)");
    }
    
    if (error.message.includes("timeout")) {
      console.log("\n⏰ Timeout Issue:");
      console.log("   - Cluster might be paused or starting up");
      console.log("   - Check cluster status in MongoDB Atlas");
      console.log("   - Wait a few minutes and try again");
    }
    
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

// Run the test
console.log("🚀 MongoDB Atlas Connection Tester");
console.log("==================================");
console.log("Cluster: workverse.qohwaws.mongodb.net");
console.log("Username: user123");
console.log("Database: workverse");
console.log("");

testMongoDBConnection().catch(console.error);