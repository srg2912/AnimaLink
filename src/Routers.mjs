import { Router } from 'express';
import { updateTextFile, updateMemoryFile } from './Write_To.mjs';
import { readTextFile, readMemoryFile } from './Read_File.mjs';
import ask_LLM from './LLM_Request.mjs';

const router = Router();

// POST Request to get character's personality
router.post('/api/personality', async (req, res) => {
  const { name, personality, looks, language } = req.body; //Looks: male or female. Language: Spanish, English, Italian for now.
  
  if (!name || !personality) return res.status(400).json({ error: 'Name and personality are required.' });
  
  try {
    const prompt = `Create a detailed personality profile for a fictional character 
    named "${name}". The character is a ${looks}.
    Their personality can be described as: ${personality}. 
    The character should speak ${language}.
    Keep it concise and avoid using any markdown or formatting.
    Write in plain text, with no bullet points, bold text, numbered sections or new lines.
    Return you response in the same language the character speaks.
    `;
    const result = await ask_LLM(prompt);
    updateTextFile(result, './memory/personality.txt', 'w');
    res.status(201).json({ characterProfile: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
});

// POST Request to send a message to the character
router.post('/api/message', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' });

  const personality =  await readTextFile('./memory/personality.txt');
  if (!personality) return res.status(400).json({ error: 'Personality required.' });

  const previousMessages = await readMemoryFile('./memory/short_term.json');
  const instruction = `You're the following character, act accordingly without breaking character: ${personality}`;
  
  try {
    const result = await ask_LLM(message, instruction, previousMessages);
    previousMessages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: result }
    );
    updateMemoryFile('./memory/short_term.json', previousMessages);
    res.status(201).json({ characterResponse: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

export default router;