const User = require("../models/User");

// @desc    Get all users (admin only)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-__v").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's role (admin only)
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
