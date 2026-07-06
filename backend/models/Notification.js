import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: [
        "new_bid",
        "counter_offer",
        "hired",
        "counter_accepted",
        "gig_assigned",
        "stage_update",
        "work_submitted",
        "work_approved",
        "changes_requested",
        "new_message"
      ],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    gigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Gig",
      default: null
    },
    bidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);