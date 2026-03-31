const Category = require("../models/Category");
const Product = require("../models/Product");

// @desc    Create a category
// @route   POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      user: req.user._id,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all categories for the user
// @route   GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({
      createdAt: -1,
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Check for duplicate name (excluding current)
    const duplicate = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    category.name = name.trim();
    await category.save();

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // Prevent deletion if products exist under this category
    const productCount = await Product.countDocuments({
      category: category._id,
    });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete category with ${productCount} product(s). Remove products first.`,
      });
    }

    await category.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
