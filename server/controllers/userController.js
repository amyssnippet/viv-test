const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Chat, Message, DeveloperTool, RequestLog } = require('../models/psqlSchema');
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');
const sharp = require("sharp");
const axios = require('axios');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const generateImage = async (req, res) => {
  const { prompt, chatId, userId } = req.body;

  if (!prompt || !chatId || !userId) {
    return res.status(400).json({ message: "Prompt, chatId, or userId missing" });
  }

  try {
    const response = await axios.post(
      "https://simg.ai.cosinv.com/generate",
      { prompt },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data, "binary");
    const filename = `${uuidv4()}.png`;
    const key = `generated-images/${filename}`;
    await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    }).promise();

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const streamUrl = `https://cp.cosinv.com/api/v1/stream-image?userId=${userId}&chatId=${chatId}&filename=${filename}`;
    await Message.bulkCreate([
      { chatId, role: 'user', content: prompt },
      { chatId, role: 'assistant', content: `Image generated from prompt: "${prompt}" - ${streamUrl}` }
    ]);

    res.json({ imageUrl: streamUrl });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ message: "Failed to generate image" });
  }
};

const streamImage = async (req, res) => {
  const { userId, chatId, filename } = req.query;

  if (!userId || !chatId || !filename) {
    return res.status(400).json({ message: "Missing params" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const s3Stream = s3.getObject({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `generated-images/${filename}`,
    }).createReadStream();

    s3Stream.on("error", (err) => {
      console.error("Error streaming from S3", err);
      res.status(404).json({ message: "Image not found" });
    });

    res.setHeader("Content-Type", "image/png");
    s3Stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching image" });
  }
};

const generateAndStreamUrl = async (req, res) => {
  const { prompt, chatId, userId } = req.body;

  if (!prompt || !chatId || !userId) {
    return res.status(400).json({ message: "Prompt, chatId, or userId missing" });
  }

  try {
    const response = await axios.post(
      "https://simg.ai.cosinv.com/generate",
      { prompt },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data, "binary");
    const filename = `${uuidv4()}.png`;
    const s3Key = `generated-images/${filename}`;

    await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: "image/png",
    }).promise();

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const chat = await Chat.findOne({ where: { id: chatId, UserId: userId } });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const streamUrl = `/api/image/stream?userId=${userId}&chatId=${chatId}&filename=${filename}`;
    await Message.bulkCreate([
      { chatId, role: 'user', content: prompt },
      { chatId, role: 'assistant', content: `Image generated for: "${prompt}"`, imageUrl: streamUrl }
    ]);

    res.status(200).json({ imageUrl: streamUrl });
  } catch (err) {
    console.error("Image generation error:", err);
    res.status(500).json({ message: "Failed to generate and stream image" });
  }
};

const Signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, profile } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profileImage = profile?.trim() || "https://avatars.githubusercontent.com/u/135108994?v=4";

    const newUser = await User.create({
      fullName: name,
      email,
      password: hashedPassword,
      profile: profileImage,
      count: 4000,
      date: new Date(),
      isDeveloper: false
    });

    const token = jwt.sign(
      { userId: newUser.id },
      "kjdssdhjkfsdjkdskjfshshfk",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, name: email },
      "kjdssdhjkfsdjkdskjfshshfk",
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
    console.log(error)
  }
};

const fetchUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByPk(id, {
      attributes: ['id', 'fullName', 'email', 'profile']
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      _id: user.id,
      name: user.fullName,
      email: user.email,
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const exportUserData = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'Missing userId in request body' });
  }

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Chat,
          include: [Message],
        },
        {
          model: DeveloperTool,
          include: [RequestLog],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { profile, ...userDataWithoutImage } = user.toJSON();

    return res.json({
      ...userDataWithoutImage,
      profileImageUrl: `/user/${userId}/profile-image`,
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserProfileImage = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId);
    if (!user || !user.profile) {
      return res.status(404).send('Image not found');
    }

    const base64Data = user.profile;

    // Check and extract MIME type (if stored with metadata)
    const matches = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).send('Invalid image format');
    }

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    res.setHeader('Content-Type', mimeType);
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error sending profile image:', error);
    res.status(500).send('Server error');
  }
};

const validateEndpoint = async (req, res) => {
  const { endpoint } = req.params;
  const { userId, prompt, model, instructions, stream = false } = req.body;
  let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tool = await DeveloperTool.findOne({ where: { UserId: userId, endpoint } });
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Invalid endpoint' });
    }

    const now = new Date();
    const cooldown = 5000;
    if (tool.lastRequestAt && (now - new Date(tool.lastRequestAt)) < cooldown) {
      const waitTime = Math.ceil((10000 - (now - new Date(tool.lastRequestAt))) / 1000);
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${waitTime} second(s).`
      });
    }

    if (tool.tokens <= 0) {
      return res.status(403).json({ success: false, message: 'Insufficient tokens' });
    }

    const selectedModel = model || 'numax';
    const messages = [];
    if (instructions?.trim()) {
      messages.push({ role: 'system', content: instructions });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.cosinv.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, messages, stream })
    });

    if (!response.ok) {
      throw new Error('Failed to connect to LLM server');
    }

    let totalEvalCount = 0;
    let totalPromptEvalCount = 0;
    const responseChunks = [];

    if (stream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;

          try {
            const json = JSON.parse(part);
            if (json?.message?.content) {
              responseChunks.push(json.message.content);
            }
            if (json.eval_count !== undefined) {
              totalEvalCount = json.eval_count;
            }
            if (json.prompt_eval_count !== undefined) {
              totalPromptEvalCount = json.prompt_eval_count;
            }
          } catch (err) {
            console.warn('JSON parse error on chunk:', part);
          }
        }
      }
    } else {
      const json = await response.json();
      if (json?.message?.content) {
        responseChunks.push(json.message.content);
      }
      if (json.eval_count !== undefined) {
        totalEvalCount = json.eval_count;
      }
      if (json.prompt_eval_count !== undefined) {
        totalPromptEvalCount = json.prompt_eval_count;
      }
    }

    const totalTokensUsed = totalEvalCount + totalPromptEvalCount;
    if (tool.tokens < totalTokensUsed) {
      return res.status(403).json({ success: false, message: 'Not enough tokens to complete this request' });
    }

    await tool.update({
      tokens: tool.tokens - totalTokensUsed,
      lastUsedAt: now,
      lastRequestAt: now,
      lastRequestIP: ip
    });

    await RequestLog.create({
      DeveloperToolId: tool.id,
      timestamp: now,
      ip,
      model: selectedModel,
      prompt,
      instructions,
      response: responseChunks.join(' '),
      totalTokensUsed
    });

    return res.status(200).json({
      success: true,
      message: `${model} response processed and tokens deducted`,
      remainingTokens: tool.tokens - totalTokensUsed,
      totalTokensUsed,
      model: selectedModel,
      response: responseChunks
    });
  } catch (err) {
    console.error('[Validate Endpoint ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const validateEndpointforPG = async (req, res) => {
  const { endpoint } = req.params;
  const { userId, prompt, model, instructions, stream = false } = req.body;
  let ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const tool = await DeveloperTool.findOne({ where: { UserId: userId, endpoint } });
    if (!tool) return res.status(404).json({ success: false, message: 'Invalid endpoint' });

    const now = new Date();
    const baseCooldown = 10000; // 10 seconds
    const maxCooldown = 240000; // 240 seconds
    const freeRequests = 3;

    // Initialize fields if not set
    if (tool.requestCount == null) tool.requestCount = 0;
    if (!tool.lastRequestAt) tool.lastRequestAt = new Date(0);
    if (!tool.cooldownResetAt) tool.cooldownResetAt = new Date(now); // set it first time

    // Reset request count if cooldownResetAt expired
    if (now >= new Date(tool.cooldownResetAt)) {
      tool.requestCount = 0;
      tool.cooldownResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // next reset in 24h
    }

    const lastRequestTime = new Date(tool.lastRequestAt);
    let waitTime = 0;

    if (tool.requestCount >= freeRequests) {
      const excessRequests = tool.requestCount - freeRequests + 1;
      const calculatedCooldown = Math.min(baseCooldown * Math.pow(2, excessRequests - 1), maxCooldown);
      const nextAllowedTime = new Date(lastRequestTime.getTime() + calculatedCooldown);

      if (now < nextAllowedTime) {
        const remaining = Math.ceil((nextAllowedTime - now) / 1000);
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Try again in ${remaining} second(s).`
        });
      }
    }

    if (tool.tokens <= 0) {
      return res.status(403).json({ success: false, message: 'Insufficient tokens' });
    }

    const selectedModel = model || 'numax';
    const messages = [];
    if (instructions?.trim()) messages.push({ role: 'system', content: instructions });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.cosinv.com/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: selectedModel, messages, stream })
    });

    if (!response.ok) throw new Error('Failed to connect to LLM server');

    let totalEvalCount = 0;
    let totalPromptEvalCount = 0;
    const responseChunks = [];

    if (stream) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n');
        buffer = parts.pop();

        for (const part of parts) {
          if (!part.trim()) continue;
          try {
            const json = JSON.parse(part);
            if (json?.message?.content) responseChunks.push(json.message.content);
            if (json.eval_count !== undefined) totalEvalCount = json.eval_count;
            if (json.prompt_eval_count !== undefined) totalPromptEvalCount = json.prompt_eval_count;
          } catch (err) {
            console.warn('JSON parse error on chunk:', part);
          }
        }
      }
    } else {
      const json = await response.json();
      if (json?.message?.content) responseChunks.push(json.message.content);
      if (json.eval_count !== undefined) totalEvalCount = json.eval_count;
      if (json.prompt_eval_count !== undefined) totalPromptEvalCount = json.prompt_eval_count;
    }

    const totalTokensUsed = totalEvalCount + totalPromptEvalCount;
    if (tool.tokens < totalTokensUsed) {
      return res.status(403).json({ success: false, message: 'Not enough tokens to complete this request' });
    }

    // Update the tool state
    await tool.update({
      tokens: tool.tokens - totalTokensUsed,
      lastUsedAt: now,
      lastRequestAt: now,
      lastRequestIP: ip,
      requestCount: tool.requestCount + 1,
      cooldownResetAt: tool.cooldownResetAt // Ensure it persists
    });

    await RequestLog.create({
      DeveloperToolId: tool.id,
      timestamp: now,
      ip,
      model: selectedModel,
      prompt,
      instructions,
      response: responseChunks.join(' '),
      totalTokensUsed
    });

    return res.status(200).json({
      success: true,
      message: `${selectedModel} response processed and tokens deducted`,
      remainingTokens: tool.tokens - totalTokensUsed,
      totalTokensUsed,
      model: selectedModel,
      response: responseChunks
    });
  } catch (err) {
    console.error('[Validate Endpoint ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

const createEndpoint = async (req, res) => {
  const { userId } = req.params;
  const { name, tokens } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.warn(`[CreateEndpoint] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const toolCount = await DeveloperTool.count({ where: { UserId: userId } });
    if (toolCount >= 3) {
      console.info(`[CreateEndpoint] User ${userId} already has 3 developer tools`);
      return res.status(400).json({ success: false, message: 'Endpoint Limit Exceeded' });
    }

    const endpoint = uuidv4();
    const newTool = await DeveloperTool.create({
      UserId: userId,
      name,
      endpoint,
      tokens: tokens || 1000,
      createdAt: new Date()
    });

    await user.update({ isDeveloper: true });

    console.log(`[CreateEndpoint] Endpoint created for user ${userId}: ${endpoint}`);
    return res.status(201).json({
      success: true,
      message: 'Endpoint created successfully',
      endpoint,
      toolName: name,
      tokens: newTool.tokens
    });
  } catch (err) {
    console.error('[CreateEndpoint] Error:', { message: err.message, stack: err.stack, userId, requestBody: req.body });
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteEndpoint = async (req, res) => {
  const { userId } = req.params;
  const { endpoint } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      console.warn(`[DeleteEndpoint] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tool = await DeveloperTool.findOne({ where: { UserId: userId, endpoint } });
    if (!tool) {
      console.info(`[DeleteEndpoint] Endpoint not found: ${endpoint}`);
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }

    await tool.destroy();

    const remainingTools = await DeveloperTool.count({ where: { UserId: userId } });
    if (remainingTools === 0) {
      await user.update({ isDeveloper: false });
    }

    console.log(`[DeleteEndpoint] Deleted endpoint ${endpoint} for user ${userId}`);
    return res.status(200).json({
      success: true,
      message: 'Endpoint deleted successfully',
      remainingTools
    });
  } catch (err) {
    console.error('[DeleteEndpoint] Error:', { message: err.message, stack: err.stack, userId, requestBody: req.body });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getUserDeveloperTools = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId, {
      attributes: ['isDeveloper'],
      include: [{ model: DeveloperTool, attributes: ['id', 'name', 'endpoint', 'tokens', 'createdAt', 'lastUsedAt', 'lastRequestAt', 'lastRequestIP'] }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isDeveloper) {
      return res.status(403).json({ message: 'User is not a developer' });
    }

    res.status(200).json({ developerTools: user.DeveloperTools });
  } catch (err) {
    console.error('Error fetching developer tools:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserCount = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByPk(userId, { attributes: ['count'] });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ count: user.count });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error });
    }
    console.error("Error in getUserCount:", error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, name, email, profilePic, password } = req.body;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name) updates.fullName = name;
    if (email) updates.email = email;
    if (profilePic) updates.profile = profilePic;
    if (password) updates.password = await bcrypt.hash(password, 10);

    await user.update(updates);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  Signup, Login, validateEndpoint, createEndpoint, fetchUser, getUserDeveloperTools,
  generateImage, streamImage, generateAndStreamUrl, getUserCount, updateUser, deleteEndpoint, validateEndpointforPG, exportUserData, getUserProfileImage
};