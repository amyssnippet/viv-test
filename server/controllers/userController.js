const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");

const Signup = async(req, res)=>{
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

const Login = async(req, res)=>{
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
const UpdateUser = async (req, res) => {
  try {
    console.log("Received Data:", req.body); // Debugging

    const { userId, name, email, password } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let updateFields = {};

    if (name) updateFields.fullName = name;
    if (email) updateFields.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    console.error("Error in UpdateUser:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = { Signup, Login, UpdateUser };