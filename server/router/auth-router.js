const express = require("express");
const router = express.Router();
const authcontrollers = require("../controllers/auth-controllers");
const protect = require("../middlewares/protect");
const upload = require("../middlewares/multer");

router.route("/").get(authcontrollers.home);
router.route("/register").post(authcontrollers.register);
router.route("/verify-otp").post(authcontrollers.verifyUser);
router.route("/login").post(authcontrollers.login);
router.route("/logout").post(authcontrollers.logout);

module.exports = router;