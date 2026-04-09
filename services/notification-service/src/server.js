import dotenv from 'dotenv';
dotenv.config(); // 🔥 MUST BE FIRST

import app from './app.js';
import connectDB from './config/database.js';
import { logger } from './utils/helpers.js';

const PORT = process.env.PORT || 4006;

const startServer = async () => {
  try {
    // 🔍 DEBUG (remove later)
    console.log("MONGODB_URI:", process.env.MONGODB_URI);

    // Connect to database
    await connectDB();
    
    const server = app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check available at: http://localhost:${PORT}/health`);
    });
    
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
      
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();