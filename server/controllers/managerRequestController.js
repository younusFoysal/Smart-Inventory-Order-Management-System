const ManagerRequest = require("../models/ManagerRequest");
const User = require("../models/User");

// @desc    Send a manager request (admin → target user)
// @route   POST /api/manager-requests
exports.sendRequest = async (req, res) => {
  try {
    const { to } = req.body;
    const from = req.user._id;

    if (from.toString() === to) {
      return res.status(400).json({ message: "You cannot send a request to yourself" });
    }

    const targetUser = await User.findById(to);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If target is already a manager assigned to someone
    if (targetUser.role === "manager" && targetUser.assignedAdmin) {
      return res.status(400).json({ message: "This user is already assigned as a manager to another admin" });
    }

    // Check if there's already a pending request from this admin to this user
    const existingPending = await ManagerRequest.findOne({
      from,
      to,
      status: "pending",
    });
    if (existingPending) {
      return res.status(400).json({ message: "A pending request already exists for this user" });
    }

    const request = await ManagerRequest.create({ from, to });
    const populated = await request.populate("from", "name email");

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending requests for the current user (incoming)
// @route   GET /api/manager-requests/incoming
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await ManagerRequest.find({
      to: req.user._id,
      status: "pending",
    })
      .populate("from", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get requests sent by the current admin (outgoing)
// @route   GET /api/manager-requests/outgoing
exports.getOutgoingRequests = async (req, res) => {
  try {
    const requests = await ManagerRequest.find({
      from: req.user._id,
    })
      .populate("to", "name email role")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a manager request
// @route   PUT /api/manager-requests/:id/accept
exports.acceptRequest = async (req, res) => {
  try {
    const request = await ManagerRequest.findOne({
      _id: req.params.id,
      to: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Update the user to manager role with assignedAdmin
    const user = await User.findById(req.user._id);
    user.role = "manager";
    user.assignedAdmin = request.from;
    await user.save();

    // Mark this request as accepted
    request.status = "accepted";
    await request.save();

    // Decline all other pending requests for this user
    await ManagerRequest.updateMany(
      { to: req.user._id, status: "pending", _id: { $ne: request._id } },
      { status: "declined" }
    );

    res.json({
      message: "Request accepted. You are now a manager.",
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, assignedAdmin: user.assignedAdmin },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline a manager request
// @route   PUT /api/manager-requests/:id/decline
exports.declineRequest = async (req, res) => {
  try {
    const request = await ManagerRequest.findOne({
      _id: req.params.id,
      to: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = "declined";
    await request.save();

    res.json({ message: "Request declined" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
