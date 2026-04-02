import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["build", "improve", "analyze"],
      required: true,
      index: true
    },
    language: {
      type: String,
      enum: ["he", "en"],
      default: "he"
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", postSchema);
