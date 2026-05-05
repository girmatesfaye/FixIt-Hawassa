import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const workerProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    title: { type: String, default: "" },
    bio: { type: String, default: "" },
    area: { type: String, required: true, trim: true },
    skills: [{ type: String, trim: true }],
    telegramUsername: { type: String, default: "" },
    tiktokProfile: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    completionRate: { type: Number, default: 0 },
    responseMinutes: { type: Number, default: 30 },
    avatar: { type: String, default: "" },
    portfolio: [{ type: String }],
  },
  {
    timestamps: true,
  },
);

export type WorkerProfileDocument = InferSchemaType<typeof workerProfileSchema>;
export type WorkerProfileModel = Model<WorkerProfileDocument>;

export const WorkerProfile =
  (models.WorkerProfile as WorkerProfileModel) ||
  model<WorkerProfileDocument>("WorkerProfile", workerProfileSchema);
