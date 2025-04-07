/**
 * Configuration options for the `VIV` function.
 */
export interface VIVConfig {
  /**
   * Full API endpoint URL including any key/path (e.g. https://cp.cosinv.com/api/v1/completions/key).
   */
  endpoint: string;

  /**
   * Unique ID of the user sending the request.
   */
  userId: string;

  /**
   * The main user input or prompt sent to the LLM.
   */
  prompt: string;

  /**
   * The model to use for generation (e.g., gpt-j, numax).
   */
  model: string;

  /**
   * Optional system instructions for the LLM.
   */
  instructions?: string;

  /**
   * Whether the response should be streamed.
   */
  stream?: boolean;
}


export interface VIVConfig {
  endpoint: string;           // Full URL
  userId: string;
  prompt: string;
  model: string;
  instructions?: string;
  stream?: boolean;
}

export async function VIV({
  endpoint,
  userId,
  prompt,
  model,
  instructions = '',
  stream = false
}: VIVConfig): Promise<any> {
  if (!endpoint || !userId || !prompt || !model) {
    throw new Error('Missing required parameters: endpoint, userId, prompt, model');
  }

  const payload = {
    userId,
    prompt,
    model,
    instructions,
    stream
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[LLM SDK ERROR]', errorData.message || response.statusText);
      throw errorData;
    }

    return await response.json();
  } catch (error) {
    console.error('[LLM SDK ERROR]', error);
    throw error;
  }
}
