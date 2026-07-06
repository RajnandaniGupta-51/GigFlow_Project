import mongoose from "mongoose";

const gigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"]
    },
    budget: {
      type: Number,
      required: [true, "Budget is required"],
      min: [1, "Budget must be a positive number"]
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    status: {
      type: String,
      enum: ["open", "assigned", "completed"],
      default: "open"
    },

    stage: {
      type: String,
      enum: ["not_started", "in_progress", "submitted", "changes_requested", "completed"],
      default: "not_started"
    },
    milestones: [
      {
        title: { type: String, required: true, trim: true },
        done: { type: Boolean, default: false }
      }
    ],
    submissionNote: {
      type: String,
      default: ""
    },
    lastSubmittedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

export default mongoose.model("Gig", gigSchema);