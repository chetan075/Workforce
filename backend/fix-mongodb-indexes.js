const { MongoClient } = require('mongodb');

async function fixIndexes() {
  const uri = "mongodb+srv://user123:80OPB092rULxVZaE@workverse.qohwaws.mongodb.net/workverse?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('workverse');
    
    // List all collections
    console.log('Collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Check if users collection exists
    const usersCollection = db.collection('users');
    const collectionExists = collections.some(col => col.name === 'users');
    
    if (collectionExists) {
      // Check existing indexes
      console.log('\nCurrent indexes on users collection:');
      const indexes = await usersCollection.indexes();
      indexes.forEach(index => {
        console.log(`- ${index.name}:`, index.key, index.unique ? '(unique)' : '', index.sparse ? '(sparse)' : '');
      });
      
      // Drop the old sparse index
      try {
        await usersCollection.dropIndex('walletAddress_1');
        console.log('✅ Dropped old sparse walletAddress_1 index');
      } catch (error) {
        console.log('ℹ️  walletAddress_1 index does not exist:', error.message);
      }
      
      // Drop the existing sparse index
      try {
        await usersCollection.dropIndex('walletAddress_sparse_unique');
        console.log('✅ Dropped existing sparse walletAddress index');
      } catch (error) {
        console.log('ℹ️  Sparse walletAddress index does not exist:', error.message);
      }
      
      // Create the correct partial filter index (only for non-null values)
      try {
        await usersCollection.createIndex(
          { walletAddress: 1 }, 
          { 
            unique: true, 
            partialFilterExpression: { walletAddress: { $exists: true, $type: "string" } },
            name: 'walletAddress_partial_unique' 
          }
        );
        console.log('✅ Created partial filter unique walletAddress index');
      } catch (error) {
        console.log('⚠️  Could not create walletAddress partial index:', error.message);
      }
      
      // Verify final indexes
      console.log('\nFinal indexes on users collection:');
      const finalIndexes = await usersCollection.indexes();
      finalIndexes.forEach(index => {
        console.log(`- ${index.name}:`, index.key, index.unique ? '(unique)' : '', index.sparse ? '(sparse)' : '');
      });
      
      // Check existing users
      const userCount = await usersCollection.countDocuments();
      console.log(`\nTotal users in MongoDB: ${userCount}`);
      
    } else {
      console.log('\n✅ Users collection does not exist yet - will be created with correct indexes on first sync');
    }
    
  } catch (error) {
    console.error('Error fixing indexes:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

fixIndexes().catch(console.error);