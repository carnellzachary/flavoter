const { OpenAIAPI } = require('openai');

const openai = new OpenAIAPI({ key: process.env.OPENAI_API_KEY }); // Replace with your actual OpenAI API key

async function queryChatGPT(prompt) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying ChatGPT:', error.message);
    throw error;
  }
}

module.exports = {
  queryChatGPT,
};