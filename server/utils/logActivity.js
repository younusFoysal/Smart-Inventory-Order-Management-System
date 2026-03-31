const ActivityLog = require("../models/ActivityLog");

/**
 * Log an activity. Fire-and-forget — errors are silently caught.
 * @param {string} action  - Human-readable description
 * @param {string} type    - "order" | "product" | "stock" | "restock"
 * @param {string} userId  - ObjectId of the user
 */
const logActivity = (action, type, userId) => {
  ActivityLog.create({ action, type, user: userId }).catch(() => {});
};

module.exports = logActivity;
