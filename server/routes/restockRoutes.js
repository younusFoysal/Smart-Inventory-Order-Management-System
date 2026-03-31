const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getRestockQueue,
  restockProduct,
} = require("../controllers/restockController");

router.use(protect);

router.get("/", getRestockQueue);
router.put("/:id", restockProduct);

module.exports = router;
