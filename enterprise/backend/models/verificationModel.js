const pool = require('../db/conn');

const addVerificationToken = async (enterprise_id, token) => {
  const res = await pool.query(
    `INSERT INTO enterprise_verifications (enterprise_id, token) VALUES ($1, $2) RETURNING *`,
    [enterprise_id, token]
  );
  return res.rows[0];
};

const verifyToken = async (token) => {
  const res = await pool.query(
    `SELECT * FROM enterprise_verifications WHERE token = $1 AND verified = FALSE`,
    [token]
  );
  return res.rows[0];
};

const markTokenAsVerified = async (token) => {
  await pool.query(
    `UPDATE enterprise_verifications SET verified = TRUE WHERE token = $1`,
    [token]
  );
};

module.exports = { addVerificationToken, verifyToken, markTokenAsVerified };
