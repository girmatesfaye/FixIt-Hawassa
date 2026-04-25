import mongoose, { Document, Schema } from "mongoose";

export interface IReport extends Document {
  type: string;
  text: string;
  requestId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  reporterUserId: mongoose.Types.ObjectId;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  adminFeedback: string;
  resolutionAction: "warning" | "none" | "resolved" | "suspend_worker";
  isDangerous: boolean;
  resolvedBy: mongoose.Types.ObjectId | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, required: true },
    text: { type: String, required: true },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
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
    adminFeedback: {
      type: String,
      default: "",
      trim: true,
    },
    resolutionAction: {
      type: String,
      enum: ["warning", "none", "resolved", "suspend_worker"],
      default: "warning",
    },
    isDangerous: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const Report = mongoose.model<IReport>("Report", reportSchema);
