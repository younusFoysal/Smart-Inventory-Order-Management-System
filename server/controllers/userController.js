const User = require("../models/User");
const ManagerRequest = require("../models/ManagerRequest");

// @desc    Get all users (admin only — excludes self)
// @route   GET /api/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-__v")
      .sort({ createdAt: -1 });

    // Attach pending/accepted request info from this admin
    const outgoing = await ManagerRequest.find({ from: req.user._id });
    const requestMap = {};
    for (const r of outgoing) {
      // Keep the latest request per target user
      const key = r.to.toString();
      if (!requestMap[key] || r.createdAt > requestMap[key].createdAt) {
        requestMap[key] = r;
      }
    }

    const enriched = users.map((u) => {
      const obj = u.toObject();
      const req = requestMap[u._id.toString()];
      obj.requestStatus = req ? req.status : null;
      obj.requestId = req ? req._id : null;
      return obj;
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's role (admin only) — for removing manager
// @route   PUT /api/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If converting back to admin, clear assignedAdmin
    if (role === 'admin') {
      user.role = 'admin';
      user.assignedAdmin = null;
      await user.save();

      // Clean up related requests
      await ManagerRequest.deleteMany({
        $or: [{ from: req.user._id, to: user._id }, { to: user._id, from: req.user._id }],
      });
    } else {
      user.role = role;
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedAdmin: user.assignedAdmin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
