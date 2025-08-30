const express = require("express");
const router = express.Router();
const authcontrollers = require("../controllers/auth-controllers");
const protect = require("../middlewares/protect");
const upload = require("../middlewares/multer");

router.route("/").get(authcontrollers.home);
router.route("/register").post(authcontrollers.register);
router.route("/verify").post(authcontrollers.verifyUser);
router.route("/login").post(authcontrollers.login);
router.route("/logout").post(authcontrollers.logout);
router.route("/update-profile-pic").post(protect, upload.single("profilePic"), authcontrollers.updateProfilePic);
router.route("/update-profile").patch(protect, authcontrollers.updateProfile);
router.route("/check-username").get(authcontrollers.checkUsername);
router.route("/search").get(authcontrollers.searchUsers);
router.route("/contacts").post(protect, authcontrollers.addContact).get(protect, authcontrollers.getContacts);
router.route("/me").get(protect, authcontrollers.me);

module.exports = router;