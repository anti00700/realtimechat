// =============================================================================
// router/ai-router.js
// =============================================================================

const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");
const { aiChat } = require("../controllers/ai-controller");

router.route("/chat").post(protect, aiChat);
// POST /api/ai/chat
// protect → validates jtoken cookie → populates req.user
// aiChat  → calls Gemini, saves response, emits via socket

module.exports = router;