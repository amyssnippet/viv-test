const { saveChat, getChatHistory } = require('../models/chatModel');

exports.sendChat = async (req, res) => {
  try {
    const { message } = req.body;
    const user_id = req.user.user_id;
    const enterprise_id = req.user.enterprise_id;

    const response = `Echo: ${message}`; // Replace with actual model response
    const chat = await saveChat({ enterprise_id, user_id, message, response });

    res.json({ chat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const history = await getChatHistory(user_id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
