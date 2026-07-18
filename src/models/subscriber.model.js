import mongoose, { Schema } from "mongoose";

const subscriberSchema = new Schema(
  {
    subscribe: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },

    channel: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Subscriber = mongoose.model("Subscriber", subscriberSchema);
