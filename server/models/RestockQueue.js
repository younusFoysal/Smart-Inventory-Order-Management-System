const mongoose = require("mongoose");

const restockQueueSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Static helper to calculate priority
restockQueueSchema.statics.calcPriority = function (stock, threshold) {
  if (stock <= 0) return "High";
  if (stock <= threshold / 2) return "Medium";
  return "Low";
};

module.exports = mongoose.model("RestockQueue", restockQueueSchema);
