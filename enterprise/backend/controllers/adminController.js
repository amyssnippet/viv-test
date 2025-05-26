const { createAdmin, getAdminByEmail } = require('../models/adminModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.createAdminAccount = async (req, res) => {
  try {
    const { name, email, password, enterprise_id } = req.body;

    const existing = await getAdminByEmail(email);
    if (existing) return res.status(409).json({ error: 'Admin already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const admin = await createAdmin({ name, email, password_hash, enterprise_id });

    res.status(201).json({ admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await getAdminByEmail(email);

    if (!admin || !(await bcrypt.compare(password, admin.password_hash)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ admin_id: admin.id, enterprise_id: admin.enterprise_id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
