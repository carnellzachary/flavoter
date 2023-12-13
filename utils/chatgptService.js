const axios = require('axios');

const chatGPTApiKey = process.env.OPENAI_API_KEY;
const chatGPTApiUrl = 'https://api.openai.com/v1/chat/completions';

async function queryChatGPT(prompt) {
  try {
    const response = await axios.post(
      chatGPTApiUrl,
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${chatGPTApiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying ChatGPT:', error.message);
    throw error;
  }
}

module.exports = {
  queryChatGPT,
};
