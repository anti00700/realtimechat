const express= require("express");
const router = express.Router();
const messageControllers = require("../controllers/message-controllers.js");
const protect = require("../middlewares/protect.js");

router.route("/").post(protect, messageControllers.sendMessage);
router.route("/:chatId").get(protect, messageControllers.getMessages);

module.exports = router;