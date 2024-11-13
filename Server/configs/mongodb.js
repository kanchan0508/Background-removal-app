import mongoose from "mongoose";

let isConnected = false; // Track the connection status

const connectedDB = async () => {
  if (isConnected) {
    console.log('=> using existing MongoDB connection');
    return;
  }

  try {
    // Listen for connection events
    mongoose.connection.on('connected', () => {
      isConnected = true; // Update status when connected
      console.log('=> Connected to MongoDB Atlas');
    });

    mongoose.connection.on('error', (err) => {
      console.error('=> MongoDB connection error:', err);
    });

    // Connect to MongoDB with options
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

  } catch (error) {
    console.error('=> MongoDB connection failed:', error);
    throw new Error('MongoDB connection error');
  }
};

export default connectedDB;
