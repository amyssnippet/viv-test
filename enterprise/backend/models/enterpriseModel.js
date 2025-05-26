const pool = require('../db/conn');

const createEnterprise = async ({ name, domain, admin_email, employee_range }) => {
  const res = await pool.query(
    `INSERT INTO enterprises (name, domain, admin_email, employee_range) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, domain, admin_email, employee_range]
  );
  return res.rows[0];
};

const getEnterpriseByDomain = async (domain) => {
  const res = await pool.query(`SELECT * FROM enterprises WHERE domain = $1`, [domain]);
  return res.rows[0];
};

module.exports = { createEnterprise, getEnterpriseByDomain };
