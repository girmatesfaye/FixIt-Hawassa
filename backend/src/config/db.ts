import mongoose from "mongoose";
import { env, isPlaceholderMongoUri } from "./env";

let dbConnected = false;
let dbMode: "mongodb" | "mock" = "mock";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return String(error);
};

const getAtlasTroubleshootingHint = (errorMessage: string): string | null => {
  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes("not whitelisted") ||
    normalized.includes("ip that isn't whitelisted") ||
    normalized.includes("ip that is not whitelisted")
  ) {
    return "[db] Atlas network access blocked this connection. Add your current public IP in Atlas: https://www.mongodb.com/docs/atlas/security/ip-access-list/";
  }

  return null;
};

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
    console.log(" Connected to MongoDB ✅");
  } catch (error) {
    dbConnected = false;
    dbMode = "mock";
    const errorMessage = getErrorMessage(error);
    console.error(
      "[db] MongoDB connection failed. Falling back to mock mode.",
      errorMessage,
    );
    const atlasHint = getAtlasTroubleshootingHint(errorMessage);
    if (atlasHint) {
      console.warn(atlasHint);
    }
  }
};

export const getDatabaseStatus = () => ({
  connected: dbConnected,
  mode: dbMode,
  provider: "mongodb",
});
