import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  requestId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "ServiceRequest",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);
