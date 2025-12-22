const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_db';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Check expenses collection
    const expenses = await mongoose.connection.db.collection('expenses').find({}).toArray();
    console.log('Expenses in database:', expenses.length);
    console.log('Expenses data:', JSON.stringify(expenses, null, 2));

    await mongoose.connection.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

connectDB();