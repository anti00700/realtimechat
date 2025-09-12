const express = require("express");
const router = express.Router();
const protect = require("../middlewares/protect");
const userControllers = require("../controllers/user-controllers");
const upload = require("../middlewares/multer");

// Get logged-in user profile
router.route("/me").get(protect, userControllers.me);

// Update profile picture
router
  .route("/update-profile-pic")
  .post(protect, upload.single("profilePic"), userControllers.updateProfilePic);

// Update display name
router.route("/update-profile").patch(protect, userControllers.updateProfile);

// Check username availability
router.route("/check-username").get(userControllers.checkUsername);

// ✅ Get all contacts
router.route("/contacts").get(protect, userControllers.getContacts);

// ✅ Add a new contact
router.route("/contacts").post(protect, userControllers.addContact);

// ✅ Search contacts (for sidebar)
router.route("/search-contacts").get(protect, userControllers.searchContacts);

// ✅ Search users globally (for new chat creation)
router.route("/search-users").get(protect, userControllers.searchUsers);

module.exports = router;
