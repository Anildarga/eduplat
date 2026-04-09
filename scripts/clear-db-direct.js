require('dotenv').config();
const { MongoClient } = require('mongodb');

async function clearDatabase() {
  const uri = process.env.DATABASE_URL;
  const client = new MongoClient(uri);

  try {
    console.log('🔑 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('eduplat');
    console.log('✅ Connected to database: eduplat');

    const collections = await db.listCollections().toArray();
    console.log(`\n🗑️ Found ${collections.length} collections. Clearing...`);

    for (const collection of collections) {
      const name = collection.name;
      const result = await db.collection(name).deleteMany({});
      console.log(`✅ Cleared ${name}: ${result.deletedCount} documents`);
    }

    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

clearDatabase();
