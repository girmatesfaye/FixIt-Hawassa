import "dotenv/config";
import mongoose from "mongoose";
import { env, isPlaceholderMongoUri } from "../config/env";
import { 
  User, 
  WorkerProfile, 
  ServiceRequest, 
  Report, 
  Review, 
  Message, 
  RecommendationSnapshot,
  Category
} from "../models";

const clearDatabase = async () => {
  if (!env.mongoUri || isPlaceholderMongoUri(env.mongoUri)) {
    throw new Error(
      "MONGODB_URI is not configured. Set a real MongoDB connection string before clearing.",
    );
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.mongoUri);

  const collections = [
    { name: "Users", model: User },
    { name: "Worker Profiles", model: WorkerProfile },
    { name: "Service Requests", model: ServiceRequest },
    { name: "Reports", model: Report },
    { name: "Reviews", model: Review },
    { name: "Messages", model: Message },
    { name: "Recommendation Snapshots", model: RecommendationSnapshot },
    { name: "Categories", model: Category }
  ];

  console.log("Clearing collections...");

  for (const collection of collections) {
    try {
      const result = await collection.model.deleteMany({});
      console.log(`- ${collection.name}: Deleted ${result.deletedCount} documents`);
    } catch (error) {
      console.error(`- Error clearing ${collection.name}:`, error);
    }
  }

  console.log("\nDatabase cleanup complete.");
};

void clearDatabase()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
    process.exit();
  });
