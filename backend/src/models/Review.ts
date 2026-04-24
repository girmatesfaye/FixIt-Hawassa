import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  requestId: mongoose.Types.ObjectId;
  workerId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    workerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true },
);

reviewSchema.index(
  { requestId: 1, workerId: 1, clientId: 1 },
  { unique: true },
);

export const Review = mongoose.model<IReview>("Review", reviewSchema);
