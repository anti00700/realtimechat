const express= require("express");
const router = express.Router();
const messageControllers = require("../controllers/message-controllers.js");
const protect = require("../middlewares/protect.js");
const upload = require("../middlewares/multer.js");

router.route("/").post(protect, messageControllers.sendMessage);
// For image messages (with file upload)
router.route("/image").post(protect, upload.single("image"), messageControllers.sendMessage);
router.route("/:chatId").get(protect, messageControllers.getMessages);
router.route("/:chatId/read").post(protect, messageControllers.markAsRead);

module.exports = router;