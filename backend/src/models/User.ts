import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["client", "worker", "admin"],
      required: true,
      default: "client",
    },
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    area: { type: String, default: "" },
    nationalId: { type: String, default: "" },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export type UserModel = Model<UserDocument>;

export const User =
  (models.User as UserModel) || model<UserDocument>("User", userSchema);
