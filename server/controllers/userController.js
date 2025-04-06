const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const { customAlphabet } = require("nanoid");

const Signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate passwords
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ fullName: name, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, "kjdssdhjkfsdjkdskjfshshfk", { expiresIn: "1d" });

    res.status(200).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ userId: user._id, name: email }, "kjdssdhjkfsdjkdskjfshshfk", { expiresIn: "1d" });
    console.log(token);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const validateEndpoint = async (req, res) => {
  const { endpoint } = req.params;
  const { userId, tokenUsage = 1 } = req.body; // tokenUsage = number of tokens to spend

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tool = user.developerTools.find(t => t.endpoint === endpoint);
    if (!tool) return res.status(404).json({ success: false, message: 'Invalid endpoint' });

    if (tool.tokens < tokenUsage) {
      return res.status(403).json({ success: false, message: 'Insufficient tokens' });
    }

    tool.tokens -= tokenUsage;
    tool.lastUsedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Endpoint validated and tokens deducted',
      remainingTokens: tool.tokens
    });

  } catch (err) {
    console.error('[Validate Endpoint]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 25);

const createEndpoint = async (req, res) => {
  const { userId } = req.params;
  const { name, tokens } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const endpoint = nanoid();

    const newTool = {
      name,
      endpoint,
      tokens: tokens || 1000,
      createdAt: new Date()
    };

    user.developerTools.push(newTool);
    user.isDeveloper = true;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Endpoint created successfully',
      endpoint,
      toolName: name,
      tokens: newTool.tokens
    });
  } catch (err) {
    console.error('[Create Endpoint]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { Signup, Login, validateEndpoint, createEndpoint }