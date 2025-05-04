const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
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
    // 1. Generate image buffer
    const response = await axios.post(
      "https://simg.ai.cosinv.com/generate",
      { prompt },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data, "binary");

    // 2. Upload to S3 (private)
    const filename = `${uuidv4()}.png`;
    const key = `generated-images/${filename}`;
    await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: "image/png",
      })
      .promise();

    // 3. Save chat message
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const chat = user.chats.id(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const streamUrl = `https://cp.cosinv.com/api/v1/stream-image?userId=${userId}&chatId=${chatId}&filename=${filename}`;

    chat.messages.push({ role: "user", content: prompt });
    chat.messages.push({
      role: "assistant",
      content: `Image generated from prompt: "${prompt}" - ${streamUrl}`,
    });

    await user.save();

    // 4. Return stream URL (not S3 URL)
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
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const chat = user.chats.id(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Optionally verify that the image filename is mentioned in chat messages

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
    // 1. Generate image from external API
    const response = await axios.post(
      "https://simg.ai.cosinv.com/generate",
      { prompt },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(response.data, "binary");

    // 2. Upload to S3
    const filename = `${uuidv4()}.png`;
    const s3Key = `generated-images/${filename}`;

    await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: "image/png",
    }).promise();

    // 3. Update user + chat with reference to image
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const chat = user.chats.id(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const streamUrl = `/api/image/stream?userId=${userId}&chatId=${chatId}&filename=${filename}`;

    chat.messages.push({ role: "user", content: prompt });
    chat.messages.push({
      role: "assistant",
      content: `Image generated for: "${prompt}"`,
      imageUrl: streamUrl,
    });

    await user.save();

    // 4. Return stream URL
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 👇 Set default profile image if none is provided
    const profileImage = profile?.trim()
      ? profile
      : "https://avatars.githubusercontent.com/u/135108994?v=4";

    const newUser = new User({
      fullName: name,
      email,
      password: hashedPassword,
      profile: profileImage,
    });

    await newUser.save();

    console.log("User saved:", newUser);

    const token = jwt.sign(
      { userId: newUser._id },
      "kjdssdhjkfsdjkdskjfshshfk",
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
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
    console.log(email, password);
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate token
    const token = jwt.sign({ userId: user._id, name: email }, "kjdssdhjkfsdjkdskjfshshfk", { expiresIn: "1d" });
    console.log(token);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

const fetchUser = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // You can customize what fields you want to send back (e.g., omit password)
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profile: user.profile, // assuming this is where your base64 profile image is stored
    });
  } catch (error) {
    // console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const validateEndpoint = async (req, res) => {
  const { endpoint } = req.params;
  const { userId, prompt, model, instructions, stream = false } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tool = user.developerTools.find(t => t.endpoint === endpoint);
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Invalid endpoint' });
    }

    // ✅ Rate limiting logic (1 request per 10 seconds)
    const now = new Date();
    const lastRequestAt = tool.lastRequestAt ? new Date(tool.lastRequestAt) : null;
    if (lastRequestAt && (now - lastRequestAt) < 10_000) {
      const waitTime = Math.ceil((10_000 - (now - lastRequestAt)) / 1000);
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
      body: JSON.stringify({
        model: selectedModel,
        messages,
        stream
      })
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

    tool.tokens -= totalTokensUsed;
    tool.lastUsedAt = now;
    tool.lastRequestAt = now; // ✅ update rate limit timestamp
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'LLM response processed and tokens deducted',
      remainingTokens: tool.tokens,
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
    const user = await User.findById(userId);

    if (!user) {
      console.warn(`[CreateEndpoint] User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Limit check for developer tools
    if (user.developerTools.length >= 3) {
      console.info(`[CreateEndpoint] User ${userId} already has 3 developer tools`);
      return res.status(400).json({
        success: false,
        message: 'Endpoint Limit Exceeded'
      });
    }

    const endpoint = uuidv4();

    const newTool = {
      name,
      endpoint,
      tokens: tokens || 1000,
      createdAt: new Date()
    };

    user.developerTools.push(newTool);
    user.isDeveloper = true;

    await user.save();

    console.log(`[CreateEndpoint] Endpoint created for user ${userId}: ${endpoint}`);

    return res.status(201).json({
      success: true,
      message: 'Endpoint created successfully',
      endpoint,
      toolName: name,
      tokens: newTool.tokens
    });

  } catch (err) {
    console.error('[CreateEndpoint] Error:', {
      message: err.message,
      stack: err.stack,
      userId,
      requestBody: req.body
    });

    // Optional: Catch validation errors explicitly
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        details: err.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const deleteEndpoint = async (req, res) => {
  const { userId } = req.params;
  const { endpoint } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[DeleteEndpoint] User not found: ${userId}`);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const originalCount = user.developerTools.length;

    // Filter out the tool to be deleted
    user.developerTools = user.developerTools.filter(tool => tool.endpoint !== endpoint);

    // If nothing changed, the endpoint wasn't found
    if (user.developerTools.length === originalCount) {
      console.info(`[DeleteEndpoint] Endpoint not found: ${endpoint}`);
      return res.status(404).json({ success: false, message: 'Endpoint not found' });
    }

    // If all tools are deleted, reset isDeveloper to false
    if (user.developerTools.length === 0) {
      user.isDeveloper = false;
    }

    await user.save();

    console.log(`[DeleteEndpoint] Deleted endpoint ${endpoint} for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: 'Endpoint deleted successfully',
      remainingTools: user.developerTools
    });

  } catch (err) {
    console.error('[DeleteEndpoint] Error:', {
      message: err.message,
      stack: err.stack,
      userId,
      requestBody: req.body
    });

    res.status(500).json({ success: false, message: 'Server error' });
  }
};


const getUserDeveloperTools = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select('isDeveloper developerTools');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isDeveloper) {
      return res.status(403).json({ message: 'User is not a developer' });
    }

    res.status(200).json({
      developerTools: user.developerTools
    });

  } catch (err) {
    console.error('Error fetching developer tools:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getUserCount = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("countttttt", userId);

    const user = await User.findById(userId).select('count');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log("User count:", user.count); // ✅ Fix this
    res.status(200).json({ count: user.count });

  } catch (error) {
    // Only respond if no response was already sent
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error', error });
    }
    console.error("Error in getUserCount:", error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId, name, email, profilePic, password } = req.body;
    //  console.log(req.body)

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Update fields
    if (name) user.fullName = name;
    if (email) user.email = email;
    if (profilePic) user.profile = profilePic;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { Signup, Login, validateEndpoint, createEndpoint, fetchUser, getUserDeveloperTools, generateImage, streamImage, generateAndStreamUrl, getUserCount, updateUser, deleteEndpoint
 };
