const ActivityLog = require("../models/ActivityLog");
const getDataOwner = require("../utils/getDataOwner");

// @desc    Get recent activity logs
// @route   GET /api/activity
exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: getDataOwner(req) })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
