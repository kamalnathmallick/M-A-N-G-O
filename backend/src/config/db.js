import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

// Disable buffering so queries fail-fast when MongoDB is offline
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`[MongoDB] Notice: Could not connect to MongoDB at ${env.MONGO_URI} (${error.message}).`);
    console.warn(`[MongoDB] Running in offline/fallback mode. API will serve structured agricultural telemetry.`);
  }
};

export const getDBStatus = () => ({
  isConnected: mongoose.connection.readyState === 1,
  readyState: mongoose.connection.readyState,
  host: mongoose.connection.host || 'none'
});
