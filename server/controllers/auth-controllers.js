const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user-model");
const generateToken = require("../utils/generateToken");
const generateOtpToken = require("../utils/generateOtpToken");
const sendMail = require("../utils/sendMail");
const TryCatch = require("../middlewares/TryCatch");
const upload = require("../middlewares/multer")
const cloudinary = require("../utils/cloudinary");

const home = TryCatch(async (req, res) => {
  res.status(200).json({ msg: "Welcome to the home controller" });
});

const register = TryCatch(async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  // Check if email exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    return res.status(400).json({ msg: userExists.email === email ? "Email already in use" : "Username taken" });
  }

  // Hash password
  const hashPassword = await bcrypt.hash(password, 10);

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Generate OTP token
  const otpToken = generateOtpToken({ email, otp, username, password: hashPassword });

  // Send OTP email
  await sendMail(email, "OTP Verification", { username, otp });

  res.status(200).json({
    msg: "OTP sent to email. Please verify to complete registration",
    otpToken,
  });
});

const verifyUser = TryCatch(async (req, res) => {
  const { otp, otpToken } = req.body;

  // Verify OTP token
  const verify = jwt.verify(otpToken, process.env.OTP_SECRET);
  if (!verify) {
    return res.status(400).json({ message: "OTP Expired" });
  }

  if (verify.otp !== otp.toString()) {
    return res.status(400).json({ message: "Wrong OTP" });
  }

  // Create and save user
  const newUser = await User.create({
    username: verify.username,
    email: verify.email,
    password: verify.password,
  });

  // Generate JWT
  const token = generateToken(newUser._id, res);

  res.status(201).json({ message: "User registered successfully", token });
});

const login = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ msg: "All fields are required" });
  }

  // Check if user exists
    const user = await User.findOne({email});
  if (!user) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  // Generate JWT
  const token = generateToken(user._id, res);

  const { password: _, ...userData } = user.toObject();

  res.status(200).json({ message: `Welcome back ${user.username}`, token, user: userData });
});

const logout = TryCatch(async (req, res) => {
  res.clearCookie("jtoken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
  res.status(200).json({ msg: "Logged out successfully" });
});

const updateProfilePic = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ msg: "No image uploaded"});
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(400).json({ msg:"User not found"});
  }

  //upload to cloudinary
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {folder: "profile_pics", public_id: `user_${userId}`, overwrite:true},
      (error, result)=> {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(file.buffer)
  });

  user.profilePic = result.secure_url;
  await user.save();

  const { password: _, ...userData } = user.toObject();

  res.status(200).json({ msg: "Profile picture updated", user: userData });
});


const updateProfile = TryCatch(async (req, res) => {
  const { displayName } = req.body;
  const userId = req.user._id;

  if (!displayName) {
    return res.status(400).json({ msg: "Display name is required" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }

  user.displayName = displayName.trim();
  await user.save();

  const { password: _, ...userData } = user.toObject();
  req.io.to(userId).emit("profileUpdated", { userId, displayName: userData.displayName });
  res.status(200).json({ msg: "Profile updated", user: userData });
});

const checkUsername = TryCatch(async (req, res) => {
  const { username } = req.query;
  const user = await User.findOne({ username });
  res.status(200).json({ available: !user });
});

const searchUsers = TryCatch(async (req, res) => {
  const { query } = req.query;
  const users = await User.find({
    username: { $regex: query, $options: "i" },
  }).select("username displayName profilePic");
  res.status(200).json(users);
});


const getContacts = TryCatch(async (req,res) => {
  const user = await User.findById(req.user._id)
  .populate("conatcts.user", "username displayName profilePic")
  .select("contacts");
  res.status(200).json(user.contacts);
});


const addContact = TryCatch(async (req, res) => {
  const { userId } = req.body;
  const currentUserId = req.user._id;

  if (userId === currentUserId.toString()) {
    return res.status(400).json({ msg: "Cannot add yourself as a contact" });
  }

  const contactUser = await User.findById(userId);
  if (!contactUser) {
    return res.status(404).json({ msg: "User not found" });
  }

  const currentUser = await User.findById(currentUserId);
  if (currentUser.contacts.some((contact) => contact.user.toString() === userId)) {
    return res.status(400).json({ msg: "Contact already added" });
  }

  const chatId = [currentUserId, userId].sort().join("_");
  currentUser.contacts.push({ user: userId, chatId });
  await currentUser.save();

  res.status(200).json({ msg: "Contact added", chatId });
});

const me = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }
  res.status(200).json({ user });
});


module.exports = { home, register, verifyUser, login, logout, updateProfilePic, updateProfile, checkUsername, searchUsers, me, getContacts, addContact,};