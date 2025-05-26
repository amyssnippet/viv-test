const { createUser, getUserByEmail } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, enterprise_id, role } = req.body;

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password_hash, enterprise_id, role });

    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.id, enterprise_id: user.enterprise_id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
