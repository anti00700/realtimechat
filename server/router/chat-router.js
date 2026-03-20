const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect.js");
const chatControllers = require("../controllers/chat-controllers.js");



router.route("/new").post(protect, chatControllers.createOrGetOneOnOneChat);
router.route("/all").get(protect, chatControllers.getChats);

module.exports = router;