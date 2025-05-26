const pool = require('../db/conn');

const saveChat = async ({ enterprise_id, user_id, message, response }) => {
  const res = await pool.query(
    `INSERT INTO enterprise_chats (enterprise_id, user_id, message, response)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [enterprise_id, user_id, message, response]
  );
  return res.rows[0];
};

const getChatHistory = async (user_id) => {
  const res = await pool.query(
    `SELECT * FROM enterprise_chats WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return res.rows;
};

module.exports = { saveChat, getChatHistory };
