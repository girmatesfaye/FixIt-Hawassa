import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const recommendationSnapshotSchema = new Schema(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    filters: {
      maxDistanceKm: { type: Number, required: true },
      minRating: { type: Number, required: true },
      onlyActive: { type: Boolean, required: true },
    },
    recommendations: [{ type: Schema.Types.Mixed, required: true }],
    source: {
      type: String,
      enum: ["mock", "mongodb"],
      required: true,
    },
    createdAt: { type: Date, default: Date.now, required: true },
  },
  {
    versionKey: false,
  },
);

recommendationSnapshotSchema.index(
  {
    requestId: 1,
    "filters.maxDistanceKm": 1,
    "filters.minRating": 1,
    "filters.onlyActive": 1,
  },
  { unique: true },
);

export type RecommendationSnapshotDocument = InferSchemaType<
  typeof recommendationSnapshotSchema
>;
export type RecommendationSnapshotModel = Model<RecommendationSnapshotDocument>;

export const RecommendationSnapshot =
  (models.RecommendationSnapshot as RecommendationSnapshotModel) ||
  model<RecommendationSnapshotDocument>(
    "RecommendationSnapshot",
    recommendationSnapshotSchema,
  );
