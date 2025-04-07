const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const { customAlphabet } = await import('nanoid');

const Signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate passwords
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ fullName: name, email, password: hashedPassword });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ userId: newUser._id }, "kjdssdhjkfsdjkdskjfshshfk", { expiresIn: "1d" });

    res.status(200).json({ message: "User registered successfully", token });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
}

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

// const validateEndpoint = async (req, res) => {
//   const { endpoint } = req.params;
//   const { userId, prompt, model, instructions, stream } = req.body;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     const tool = user.developerTools.find(t => t.endpoint === endpoint);
//     if (!tool) {
//       return res.status(404).json({ success: false, message: 'Invalid endpoint' });
//     }

//     if (tool.tokens <= 0) {
//       return res.status(403).json({ success: false, message: 'Insufficient tokens' });
//     }

//     const selectedModel = model || 'numax';

//     // Build the messages array dynamically
//     const messages = [];

//     if (instructions && instructions.trim() !== "") {
//       messages.push({
//         role: 'system',
//         content: instructions
//       });
//     }

//     messages.push({
//       role: 'user',
//       content: prompt
//     });

//     const response = await fetch('https://api.cosinv.com/api/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         model: selectedModel,
//         messages,
//         stream
//       })
//     });

//     if (!response.ok || !response.body) {
//       throw new Error('Failed to connect to LLM server');
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder('utf-8');

//     let totalEvalCount = 0;
//     let totalPromptEvalCount = 0;
//     let fullResponseContent = '';
//     let buffer = '';

//     while (true) {
//       const { done, value } = await reader.read();
//       if (done) break;

//       buffer += decoder.decode(value, { stream: true });

//       const parts = buffer.split('\n');
//       buffer = parts.pop();

//       for (const part of parts) {
//         if (!part.trim()) continue;
//         try {
//           const json = JSON.parse(part);

//           if (json?.message?.content) {
//             fullResponseContent += json.message.content;
//           }

//           if (json.eval_count !== undefined) {
//             totalEvalCount = json.eval_count;
//           }

//           if (json.prompt_eval_count !== undefined) {
//             totalPromptEvalCount = json.prompt_eval_count;
//           }
//         } catch (err) {
//           console.warn('JSON parse error on chunk:', part);
//         }
//       }
//     }

//     const totalTokensUsed = totalEvalCount + totalPromptEvalCount;

//     if (tool.tokens < totalTokensUsed) {
//       return res.status(403).json({ success: false, message: 'Not enough tokens to complete this request' });
//     }

//     // Deduct tokens
//     tool.tokens -= totalTokensUsed;
//     tool.lastUsedAt = new Date();
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: 'LLM response processed and tokens deducted',
//       remainingTokens: tool.tokens,
//       totalTokensUsed,
//       model: selectedModel,
//       response: fullResponseContent
//     });

//   } catch (err) {
//     console.error('[Validate Endpoint ERROR]', err.message);
//     return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
//   }
// };

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
    tool.lastUsedAt = new Date();
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

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 25);

const createEndpoint = async (req, res) => {
  const { userId } = req.params;
  const { name, tokens } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const endpoint = nanoid();

    const newTool = {
      name,
      endpoint,
      tokens: tokens || 1000,
      createdAt: new Date()
    };

    user.developerTools.push(newTool);
    user.isDeveloper = true;
    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Endpoint created successfully',
      endpoint,
      toolName: name,
      tokens: newTool.tokens
    });
  } catch (err) {
    console.error('[Create Endpoint]', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { Signup, Login, validateEndpoint, createEndpoint }
