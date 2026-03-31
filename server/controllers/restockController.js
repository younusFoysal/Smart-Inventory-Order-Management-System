const RestockQueue = require("../models/RestockQueue");
const Product = require("../models/Product");
const logActivity = require("../utils/logActivity");
const getDataOwner = require("../utils/getDataOwner");

// @desc    Get unresolved restock queue items
// @route   GET /api/restock
exports.getRestockQueue = async (req, res) => {
  try {
    const items = await RestockQueue.find({
      user: getDataOwner(req),
      resolved: false,
    })
      .populate("product", "name category price stockQuantity minStockThreshold status")
      .sort({ currentStock: 1, createdAt: -1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restock a product (update stock, resolve queue item)
// @route   PUT /api/restock/:id
exports.restockProduct = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const queueItem = await RestockQueue.findOne({
      _id: req.params.id,
      user: getDataOwner(req),
      resolved: false,
    });

    if (!queueItem) {
      return res.status(404).json({ message: "Restock queue item not found" });
    }

    const product = await Product.findById(queueItem.product);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update product stock
    product.stockQuantity += quantity;
    product.status = product.stockQuantity > 0 ? "Active" : "Out of Stock";
    await product.save();

    // Mark queue item as resolved
    queueItem.resolved = true;
    await queueItem.save();

    logActivity(`Restocked "${product.name}" with ${quantity} units`, "restock", req.user._id);

    res.json({
      message: `Restocked "${product.name}" with ${quantity} units. New stock: ${product.stockQuantity}`,
      product,
      queueItem,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
