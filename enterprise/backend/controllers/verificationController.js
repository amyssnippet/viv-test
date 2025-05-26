const { verifyToken, markTokenAsVerified } = require('../models/verificationModel');

exports.verifyEnterprise = async (req, res) => {
  try {
    const { token } = req.params;
    const record = await verifyToken(token);

    if (!record) return res.status(400).json({ error: 'Invalid or already verified' });

    await markTokenAsVerified(token);
    res.status(200).json({ message: 'Enterprise verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
