import OpenAI from 'openai';
import API_KEY from '../config/user_config.json' with { type: "json" };

// Instance of OpenAI
const openai = new OpenAI({
  baseURL: API_KEY.base_url,
  apiKey: API_KEY.key
});

// Function to call the LLM
async function ask_LLM (prompt, instructions='') {
  const completion = await openai.chat.completions.create({
    model: API_KEY.model,
    messages: [
        {
            "role": "system",
            "content": instructions
        },
        {
            "role": "user",
            "content": prompt
        }
    ]
  });
  return completion.choices[0].message.content;
}

// Call to the function for testing purposes
ask_LLM('Tell me a quick fact about the Atlantic Ocean', 'Answer like a pirate.').then(console.log);