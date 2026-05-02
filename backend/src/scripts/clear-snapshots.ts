import "dotenv/config";
import mongoose from "mongoose";
import { env, isPlaceholderMongoUri } from "../config/env";
import { RecommendationSnapshot } from "../models";

const clearSnapshots = async () => {
  if (!env.mongoUri || isPlaceholderMongoUri(env.mongoUri)) {
    throw new Error(
      "MONGODB_URI is not configured. Set a real MongoDB connection string before clearing.",
    );
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.mongoUri);

  console.log("Clearing Recommendation Snapshots...");
  try {
    const result = await RecommendationSnapshot.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} recommendation snapshots.`);
  } catch (error) {
    console.error("Error clearing snapshots:", error);
  }

  console.log("Cleanup complete.");
};

void clearSnapshots()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
    process.exit();
  });
