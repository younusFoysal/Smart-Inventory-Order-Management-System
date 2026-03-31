const express = require("express");
const router = express.Router();
const {
  sendRequest,
  getIncomingRequests,
  getOutgoingRequests,
  acceptRequest,
  declineRequest,
} = require("../controllers/managerRequestController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// Admin sends a request
router.post("/", authorize("admin"), sendRequest);

// Admin views their outgoing requests
router.get("/outgoing", authorize("admin"), getOutgoingRequests);

// Any user can see incoming requests
router.get("/incoming", getIncomingRequests);

// Target user accepts/declines
router.put("/:id/accept", acceptRequest);
router.put("/:id/decline", declineRequest);

module.exports = router;
