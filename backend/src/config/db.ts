import mongoose from "mongoose";
import { env, isPlaceholderMongoUri } from "./env";

let dbConnected = false;
let dbMode: "mongodb" | "mock" = "mock";

export const connectToDatabase = async (): Promise<void> => {
  if (!env.mongoUri || isPlaceholderMongoUri(env.mongoUri)) {
    dbConnected = false;
    dbMode = "mock";
    console.warn(
      "[db] MONGODB_URI is not configured. Running in mock mode. Set MONGODB_URI to enable MongoDB.",
    );
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    dbConnected = true;
    dbMode = "mongodb";
    console.log("[db] Connected to MongoDB");
  } catch (error) {
    dbConnected = false;
    dbMode = "mock";
    console.error(
      "[db] MongoDB connection failed. Falling back to mock mode.",
      error,
    );
  }
};

export const getDatabaseStatus = () => ({
  connected: dbConnected,
  mode: dbMode,
  provider: "mongodb",
});
