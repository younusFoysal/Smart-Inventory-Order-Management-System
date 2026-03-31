/**
 * Returns the userId whose data should be queried.
 * - Admin → own data (req.user._id)
 * - Manager → their assigned admin's data (req.user.assignedAdmin)
 */
const getDataOwner = (req) => {
  if (req.user.role === "manager" && req.user.assignedAdmin) {
    return req.user.assignedAdmin;
  }
  return req.user._id;
};

module.exports = getDataOwner;
