const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.put("/:id/role", updateUserRole);

module.exports = router;
