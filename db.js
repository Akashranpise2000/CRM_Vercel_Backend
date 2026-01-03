const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // For serverless, avoid multiple connections
    if (mongoose.connection.readyState >= 1) {
      return;
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown (only for non-serverless)
    if (process.env.NODE_ENV !== 'production') {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    // In serverless, don't exit, just log
    if (process.env.NODE_ENV === 'production') {
      throw error; // Let it bubble up for serverless error handling
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;