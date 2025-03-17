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

module.exports = { Signup, Login }