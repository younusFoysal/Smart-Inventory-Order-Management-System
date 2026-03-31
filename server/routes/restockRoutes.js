const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  getRestockQueue,
  restockProduct,
} = require("../controllers/restockController");

router.use(protect);

router.get("/", getRestockQueue);
router.put("/:id", authorize("admin"), restockProduct);

module.exports = router;
