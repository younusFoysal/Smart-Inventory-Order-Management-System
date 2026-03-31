const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.route("/").get(getOrders).post(createOrder);
router.route("/:id").get(getOrder);
router.route("/:id/status").put(updateOrderStatus);

module.exports = router;
