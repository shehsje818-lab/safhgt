import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://rian:rian1122@fxgteamapply.tiupadf.mongodb.net/?appName=FxGTeamApply';

async function dropEmailIndex() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    // Drop the email index
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index');
    } catch (err) {
      console.log('Index might not exist:', err.message);
    }
    
    // List remaining indexes
    const indexes = await collection.getIndexes();
    console.log('Remaining indexes:', Object.keys(indexes));
    
    await mongoose.disconnect();
    console.log('✅ Done');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

dropEmailIndex();
