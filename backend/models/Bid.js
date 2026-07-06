import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      required: true
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: [1, "Bid price must be a positive number"]
    },
    message: {
      type: String,
      default: ""
    },
    counterPrice: {
      type: Number,
      min: [1, "Counter price must be a positive number"],
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "countered", "accepted", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

bidSchema.index({ gigId: 1, freelancerId: 1 }, { unique: true });

export default mongoose.model("Bid", bidSchema);
