import { Router } from 'express';
import { updateTextFile, updateMemoryFile } from './Write_To.mjs';
import { readTextFile, readMemoryFile } from './Read_File.mjs';
import ask_LLM from './LLM_Request.mjs';
import readContents from './get_images.mjs';

const router = Router();

// POST Request to get character's personality
router.post('/api/personality', async (req, res) => {
  const { name, personality, looks, language, sprite } = req.body;
  
  if (!name || !personality || !looks || !language || !sprite) return res.status(400).json({ error: 'One or more fields are empty.' });
  
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
    const jsonData = JSON.stringify({ 'name': name, 'looks': looks, 'sprite': sprite}, null, 2);
    updateTextFile(jsonData, './memory/general.json', 'w');
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
    const general = await readTextFile('./memory/general.json').then(JSON.parse);
    const spritesString = await readContents(`./assets/sprites/${general.sprite}`)
    const chosenSprite = await ask_LLM(`Analize the sentiments of the character in 
      the following text: ${result}
      Now choose one and only one sprite from the following list of sprites: ${spritesString}
      The sprite chosen must represt the character's sentiments as best as possible.
      Answer by only writing back the sprite you chose and nothing else, 
      keep extension of the sprite. Example of good response: 'happy.png'.
      Example of bad response: 'The sprite that fits the best to the text is happy.'`)
    previousMessages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: result, sprite: chosenSprite }
    );
    updateMemoryFile('./memory/short_term.json', previousMessages);
    res.status(201).json({ characterResponse: result, characterSprite: chosenSprite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

// DELETE Request to reset memories
// Route to delete all memories
router.delete('/api/memory', async (req, res) => {
  try {
    await updateTextFile('', './memory/personality.txt', 'w');
    await updateMemoryFile('./memory/short_term.json', []);
    await updateMemoryFile('./memory/long_term.json', []);
    return res.status(204).send('All memories deleted');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete all memories.' });
  }
});

// Route to delete a specific type of memory
router.delete('/api/memory/:type', async (req, res) => {
  const typeOfMemory = req.params.type;
  try {
    if (typeOfMemory === 'personality') {
      await updateTextFile('', './memory/personality.txt', 'w');
      return res.status(204).send('Personality deleted');
    } else if (typeOfMemory === 'shortTerm') {
      await updateMemoryFile('./memory/short_term.json', []);
      return res.status(204).send('Short term memory deleted');
    } else if (typeOfMemory === 'longTerm') {
      await updateMemoryFile('./memory/long_term.json', []);
      return res.status(204).send('Long term memory deleted');
    } else {
      return res.status(404).json({ error: 'Not a valid memory type.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
});

export default router;