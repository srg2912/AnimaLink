import OpenAI from 'openai';
import API_KEY from '../config/user_config.json' with { type: "json" };

// Instance of OpenAI
const openai = new OpenAI({
  baseURL: API_KEY.base_url,
  apiKey: API_KEY.key
});

// Function to call the LLM
async function ask_LLM(prompt, instructions = '', memory = []) {
  const messages = [];

  // Push personality or setup instructions
  if (instructions) {
    messages.push({
      role: "system",
      content: instructions,
    });
  }

  // Added short-term memory: push alternating user and assistant messages
  if (memory.length > 0) {
    memory.forEach((entry) => {
      messages.push({
        role: entry.role,
        content: entry.content,
      });
    });
  }

  // Push the current user prompt
  messages.push({
    role: "user",
    content: prompt,
  });

  // Make the API call
  const completion = await openai.chat.completions.create({
    model: API_KEY.model,
    messages,
  });

  return completion.choices[0].message.content;
}

// Call to the function for testing purposes
// ask_LLM('Tell me a quick fact about the Atlantic Ocean', 'Answer like a pirate.').then(console.log);

export default ask_LLM;