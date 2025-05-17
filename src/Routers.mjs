import { Router } from 'express';
import writeTo from './Write_To.mjs';
import ask_LLM from './LLM_Request.mjs';

const router = Router();

// POST Request to get character's personality
router.post('/api/personality', async (req, res) => {
    const { name, personality } = req.body;
  
    if (!name || !personality) return res.status(400).json({ error: 'Name and personality are required.' });
  
    try {
      const prompt = `Create a detailed personality profile for a fictional character 
      named "${name}". Their personality can be described as: ${personality}
       Keep it concise and avoid using any markdown or formatting. Write in plain text, 
       with no bullet points, bold text, numbered sections or new lines.
      `;
      const result = await ask_LLM(prompt);
      writeTo(result, './memory/personality.txt', 'w');
      res.status(201).json({ characterProfile: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'LLM request failed.' });
    }
  });

export default router;