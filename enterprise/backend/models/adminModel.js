const pool = require('../db/conn');

const createAdmin = async ({ name, email, password_hash, enterprise_id }) => {
  const res = await pool.query(
    `INSERT INTO enterprise_admins (name, email, password_hash, enterprise_id) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, email, password_hash, enterprise_id]
  );
  return res.rows[0];
};

const getAdminByEmail = async (email) => {
  const res = await pool.query(`SELECT * FROM enterprise_admins WHERE email = $1`, [email]);
  return res.rows[0];
};

module.exports = { createAdmin, getAdminByEmail };
