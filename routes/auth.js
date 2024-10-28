// routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.get("/", async (req, res) => {
  return res.json("Hello");
});

// Signup route
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }
  console.log(req,"req");
  

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword });
  await user.save();
  res.status(201).json({ message: "User created" });
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token });
});

// Logout route (optional)
router.post("/logout", (req, res) => {
  res.json({ message: "Logged out" });
});

module.exports = router;
