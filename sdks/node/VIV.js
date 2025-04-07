const axios = require('axios');

/**
 * Calls the LLM endpoint with given parameters
 * @param {Object} config
 * @param {string} config.endpoint - Full URL of the endpoint (e.g., http://51.21.245.211:4000/api/v1/completions/someKey)
 * @param {string} config.userId - User ID
 * @param {string} config.prompt - The user prompt
 * @param {string} config.model - LLM model to use (must be provided by user)
 * @param {string} [config.instructions] - Optional system instructions
 * @param {boolean} [config.stream=false] - Whether to stream response
 * @returns {Promise<Object>} - Returns the response from the server
 */
async function VIV({
  endpoint,
  userId,
  prompt,
  model,
  instructions = '',
  stream = false
}) {
  if (!endpoint || !userId || !prompt || !model) {
    throw new Error('Missing required parameters: endpoint, userId, prompt, model');
  }

  try {
    const payload = {
      userId,
      prompt,
      model,
      instructions,
      stream
    };

    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('[LLM SDK ERROR]', error.message);
    throw error.response?.data || { message: error.message };
  }
}

module.exports = { VIV };
