const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");
const { searchUsers } = require("../controllers/user-controllers");

// Only logged-in users should search for others
router.route("/search").get(protect, searchUsers);

module.exports = router;