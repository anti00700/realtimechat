const express = require("express");
const router = express.Router();
const chatControllers = require("../controllers/chat-controllers");
const protect = require("../middlewares/protect");

router.route("/")
  .get(protect, chatControllers.getAllChats)
  .post(protect, chatControllers.createOrGetChat);

router.route("/:chatId")
  .get(protect, chatControllers.getChatById);

router.route("/group")
  .post(protect, chatControllers.createGroupChat);

module.exports = router;
