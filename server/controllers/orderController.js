const Order = require("../models/Order");
const Product = require("../models/Product");
const RestockQueue = require("../models/RestockQueue");
const logActivity = require("../utils/logActivity");

// Valid status transitions
const validTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

// @desc    Create a new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { customerName, items } = req.body;

    if (!customerName || !items || items.length === 0) {
      return res.status(400).json({ message: "Customer name and at least one item are required" });
    }

    // Check for duplicate products in items
    const productIds = items.map((i) => i.product);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return res.status(400).json({ message: "This product is already added to the order." });
    }

    // Fetch all products and validate
    const products = await Product.find({
      _id: { $in: productIds },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: "One or more products not found" });
    }

    const productMap = {};
    for (const p of products) {
      productMap[p._id.toString()] = p;
    }

    // Validate stock and status for each item
    const orderItems = [];
    for (const item of items) {
      const product = productMap[item.product];

      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      if (product.status === "Out of Stock") {
        return res.status(400).json({
          message: `This product is currently unavailable: "${product.name}"`,
        });
      }

      if (item.quantity > product.stockQuantity) {
        return res.status(400).json({
          message: `Only ${product.stockQuantity} items available in stock for "${product.name}"`,
        });
      }

      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Calculate total
    const totalPrice = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Deduct stock and check restock threshold
    for (const item of orderItems) {
      const product = productMap[item.product.toString()];
      product.stockQuantity -= item.quantity;
      product.status = product.stockQuantity <= 0 ? "Out of Stock" : "Active";
      await product.save();

      // Auto-add to restock queue if stock falls below threshold
      if (product.stockQuantity <= product.minStockThreshold) {
        const existing = await RestockQueue.findOne({
          product: product._id,
          resolved: false,
        });
        if (!existing) {
          await RestockQueue.create({
            product: product._id,
            currentStock: product.stockQuantity,
            threshold: product.minStockThreshold,
            priority: RestockQueue.calcPriority(product.stockQuantity, product.minStockThreshold),
            user: req.user._id,
          });
        } else {
          existing.currentStock = product.stockQuantity;
          existing.priority = RestockQueue.calcPriority(product.stockQuantity, product.minStockThreshold);
          await existing.save();
        }
      }
    }

    // Create order
    const order = await Order.create({
      customerName: customerName.trim(),
      items: orderItems,
      totalPrice,
      user: req.user._id,
    });

    logActivity(`Order ${order.orderNumber} created for ${customerName.trim()}`, "order", req.user._id);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders with filters
// @route   GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("items.product", "name stockQuantity status");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate status transition
    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from "${order.status}" to "${status}"`,
      });
    }

    // If cancelling, restore stock
    if (status === "Cancelled") {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stockQuantity += item.quantity;
          product.status = product.stockQuantity > 0 ? "Active" : "Out of Stock";
          await product.save();
        }
      }
    }

    order.status = status;
    await order.save();

    if (status === "Cancelled") {
      logActivity(`Order ${order.orderNumber} cancelled`, "order", req.user._id);
    } else {
      logActivity(`Order ${order.orderNumber} updated to ${status}`, "order", req.user._id);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
