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
router.route("/me").get(protect, authcontrollers.me);

// Update profile picture
router
  .route("/update-profile-pic")
  .post(protect, upload.single("profilePic"), authcontrollers.updateProfilePic);

// Update display name
router.route("/update-profile").patch(protect, authcontrollers.updateProfile);

module.exports = router;