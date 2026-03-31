const Product = require("../models/Product");
const Category = require("../models/Category");
const logActivity = require("../utils/logActivity");
const getDataOwner = require("../utils/getDataOwner");

// @desc    Create a product
// @route   POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const { name, category, price, stockQuantity, minStockThreshold } = req.body;

    if (!name || !category || price == null || stockQuantity == null) {
      return res.status(400).json({ message: "Name, category, price, and stock quantity are required" });
    }

    // Verify category exists and belongs to this admin
    const cat = await Category.findOne({ _id: category, user: req.user._id });
    if (!cat) {
      return res.status(404).json({ message: "Category not found" });
    }

    const status = stockQuantity <= 0 ? "Out of Stock" : "Active";

    const product = await Product.create({
      name: name.trim(),
      category,
      price,
      stockQuantity,
      minStockThreshold: minStockThreshold ?? 5,
      status,
      user: req.user._id,
    });

    const populated = await product.populate("category", "name");

    logActivity(`Product "${product.name}" created`, "product", req.user._id);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products for the user (with filters)
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    const filter = { user: getDataOwner(req) };

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category) {
      filter.category = category;
    }
    if (status) {
      filter.status = status;
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: getDataOwner(req),
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: getDataOwner(req),
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, category, price, stockQuantity, minStockThreshold } = req.body;

    if (category) {
      const cat = await Category.findOne({ _id: category, user: getDataOwner(req) });
      if (!cat) {
        return res.status(404).json({ message: "Category not found" });
      }
      product.category = category;
    }

    if (name != null) product.name = name.trim();
    if (price != null) product.price = price;
    if (stockQuantity != null) product.stockQuantity = stockQuantity;
    if (minStockThreshold != null) product.minStockThreshold = minStockThreshold;

    // Auto-set status based on stock
    product.status = product.stockQuantity <= 0 ? "Out of Stock" : "Active";

    await product.save();
    const populated = await product.populate("category", "name");

    logActivity(`Product "${product.name}" updated`, "product", req.user._id);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      user: getDataOwner(req),
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.deleteOne();

    logActivity(`Product "${product.name}" deleted`, "product", req.user._id);

    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
