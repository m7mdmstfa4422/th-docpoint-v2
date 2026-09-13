import mongoose from 'mongoose';

/**
 * Optimal Mongoose connection options for both local development (hot-reloads)
 * and serverless production (Vercel cold/warm execution).
 */
const MONGOOSE_OPTIONS = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
};

/**
 * Global variable to maintain a cached connection across hot-reloads in development
 * and function invocations in serverless environments (Vercel).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect with retry logic and exponential backoff for network resilience
 */
async function connectWithRetry(uri, options, maxRetries = 3, initialDelay = 1000) {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[MongoDB] Connecting to MongoDB Atlas (attempt ${attempt}/${maxRetries})...`);
      const mongooseInstance = await mongoose.connect(uri, options);
      console.log('[MongoDB] Successfully connected to MongoDB Atlas.');
      return mongooseInstance;
    } catch (error) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`[MongoDB] Retrying connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

/**
 * Cached Connection Singleton to connect to MongoDB Atlas
 */
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    console.error('[MongoDB Error] MONGODB_URI environment variable is missing.');
    throw new Error('MONGODB_URI is not defined. Please configure MONGODB_URI in your environment variables.');
  }

  // If we have an existing and active connection, reuse it
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection promise is not already in flight, create one
  if (!cached.promise) {
    cached.promise = connectWithRetry(uri.trim(), MONGOOSE_OPTIONS)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null; // Reset promise on error so subsequent requests can retry
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }

  return cached.conn;
}

// Bind connection lifecycle events once
if (!global.__mongooseEventsBound) {
  global.__mongooseEventsBound = true;
  mongoose.connection.on('connected', () => {
    console.log('[MongoDB Event] Connection established.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB Event] Connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB Event] Connection disconnected.');
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
  });
}

export default connectToDatabase;
