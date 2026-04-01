import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["build", "improve", "analyze"],
      default: "build"
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Post", postSchema);
