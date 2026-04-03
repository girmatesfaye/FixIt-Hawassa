import mongoose, { Document, Schema } from "mongoose";

export interface IReport extends Document {
  type: string;
  text: string;
  reportedUserId: mongoose.Types.ObjectId;
  reporterUserId: mongoose.Types.ObjectId;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, required: true },
    text: { type: String, required: true },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reporterUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "investigating", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model<IReport>("Report", reportSchema);
