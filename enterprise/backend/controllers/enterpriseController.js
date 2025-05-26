const { createEnterprise, getEnterpriseByDomain } = require('../models/enterpriseModel');
const { addVerificationToken } = require('../models/verificationModel');
const crypto = require('crypto');

exports.registerEnterprise = async (req, res) => {
  try {
    const { name, domain, admin_email, employee_range } = req.body;

    const existing = await getEnterpriseByDomain(domain);
    if (existing) return res.status(409).json({ error: 'Enterprise already registered' });

    const enterprise = await createEnterprise({ name, domain, admin_email, employee_range });

    const token = crypto.randomBytes(32).toString('hex');
    await addVerificationToken(enterprise.id, token);

    // Normally you'd send a verification email or DNS setup instructions
    res.status(201).json({ message: 'Enterprise registered', verification_token: token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
