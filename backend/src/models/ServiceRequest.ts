import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const serviceRequestSchema = new Schema(
  {
    clientUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    landmark: { type: String, required: true, trim: true },
    maintenanceLevel: {
      type: String,
      enum: ["New", "Medium", "Old"],
      required: true,
    },
    hasPhotos: { type: Boolean, default: false },
    photoUrls: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["SEARCHING", "IN_PROGRESS", "PENDING", "COMPLETED"],
      default: "SEARCHING",
    },
    assignedWorkerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastDeclinedWorkerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    lastDeclinedAt: {
      type: Date,
      default: null,
    },
    workerMarkedCompleteAt: {
      type: Date,
      default: null,
    },
    clientConfirmedCompleteAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

serviceRequestSchema.index({ clientUserId: 1 });
serviceRequestSchema.index({ assignedWorkerId: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ category: 1 });

export type ServiceRequestDocument = InferSchemaType<
  typeof serviceRequestSchema
>;
export type ServiceRequestModel = Model<ServiceRequestDocument>;

export const ServiceRequest =
  (models.ServiceRequest as ServiceRequestModel) ||
  model<ServiceRequestDocument>("ServiceRequest", serviceRequestSchema);
