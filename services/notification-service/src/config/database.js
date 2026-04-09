import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Use hardcoded URI for now to bypass .env issues
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://avishkajayashand_db_user:991130@notification.ggyfwjx.mongodb.net/notification_service_db?retryWrites=true&w=majority&appName=notification';
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;