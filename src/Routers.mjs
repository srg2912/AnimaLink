import { Router } from 'express';
import { updateTextFile, updateMemoryFile } from './Write_To.mjs';
import { readTextFile, readMemoryFile } from './Read_File.mjs';
import { generateInstructionPrompt,  generateSpritePrompt, generatePersonalityPrompt, generateDiaryPrompt } from './Generate_Prompt.mjs';
import ask_LLM from './LLM_Request.mjs';
import { readContents, pickValidSprite } from './get_images.mjs';

const router = Router();

// POST Request to get user's API
router.post('/api/api_key', async (req, res) => {
  const { model, key, endpoint } = req.body;

  if (!model || !key || !endpoint) return res.status(400).json({ error: 'One or more fields are empty.' });

  try {
    const jsonData = JSON.stringify({ 'model': model, 'key': key, 'base_url': endpoint, 'type': 'module' }, null, 2);
    await updateTextFile(jsonData, './config/user_config.json', 'w');
    res.status(201).json({ 'model': model, 'key': key, 'base_url': endpoint, 'type': 'module' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'An error was produced when saving the data.' });
  }
});

// POST Request to get user's data
router.post('/api/user_data', async (req, res) => {
  const { name, 
    gender, 
    pronouns, 
    age = '', 
    nickname = '', 
    hobbies = '', 
    personality = '' 
  } = req.body;

  if (!name) return res.status(400).json({ error: 'Name empty.' });
  if (!gender) return res.status(400).json({ error: 'Gender empty.' });
  if (!pronouns) return res.status(400).json({ error: 'Pronouns empty.' });

  try {
    const data = {
      "name": name,
      "nickname": nickname,
      "age": age,
      "gender": gender,
      "pronouns": pronouns,
      "hobbies": hobbies,
      "personality": personality
    };
    const jsonData = JSON.stringify(data);
    await updateTextFile(jsonData, './config/user_data.json', 'w');
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Couldn\'t save user\'s data.' });
  }
});

// PATCH Request to edit user's data
router.patch('/api/user_data', async (req, res) => {
  const { name = '', 
    gender = '', 
    pronouns = '', 
    age = '', 
    nickname = '', 
    hobbies = '', 
    personality = '' 
  } = req.body;

  const currentUserData = await readTextFile('./config/user_data.json').then(JSON.parse);
  if (!currentUserData) return res.status(400).json({ error: 'No current data to edit.' });

  try {
    const data = {
      "name": name,
      "nickname": nickname,
      "age": age,
      "gender": gender,
      "pronouns": pronouns,
      "hobbies": hobbies,
      "personality": personality
    };
    for (const attribute in data) {
      currentUserData[attribute] = data[attribute];
    };
    if (!currentUserData.name) throw new Error('Cannot leave name empty.');
    if (!currentUserData.gender) throw new Error('Cannot leave gender empty.');
    if (!currentUserData.pronouns) throw new Error('Cannot leave pronouns empty.');
    const jsonData = JSON.stringify(currentUserData);
    await updateTextFile(jsonData, './config/user_data.json', 'w');
    res.status(201).json(currentUserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Couldn\'t save user\'s data.' });
  }
});

// DELETE Request to delete user's data
router.delete('/api/user_data', async (req, res) => {
  try {
    await updateTextFile('', './config/user_data.json', 'w');
    res.status(204).json({ message: 'Data deleted succesfully.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Couldn\'t delete user\'s data.' });
  }
});

// POST Request to get character's personality
router.post('/api/personality', async (req, res) => {
  const { name, personality, looks, language, sprite } = req.body;
  
  if (!name || !personality || !looks || !language || !sprite) return res.status(400).json({ error: 'One or more fields are empty.' });
  
  try {
    const personalityPrompt = generatePersonalityPrompt (name, looks, personality, language);
    const result = await ask_LLM(personalityPrompt);
    updateTextFile(result, './memory/personality.txt', 'w');
    const jsonData = JSON.stringify({ 'name': name, 'looks': looks, 'sprite': sprite}, null, 2);
    await updateTextFile(jsonData, './memory/general.json', 'w');
    res.status(201).json({ characterProfile: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
});

// POST Request to send a message to the character
router.post('/api/message', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' }); // Validating message

  const personality =  await readTextFile('./memory/personality.txt');
  if (!personality) return res.status(400).json({ error: 'Personality required.' }); // Validating personality

  const previousMessages = await readMemoryFile('./memory/short_term.json');
  const instruction = generateInstructionPrompt (personality);  // Generating prompt for character's behavior
  const previousEntries = await readMemoryFile('./memory/long_term.json');

  try {
    const result = await ask_LLM(message, instruction, previousMessages, previousEntries); // Character's response
    const general = await readTextFile('./memory/general.json').then(JSON.parse); 
    const spritesString = await readContents(`./assets/sprites/${general.sprite}`) // Gets the character's sprites
    const spritePrompt = generateSpritePrompt (result, spritesString); 
    const chosenSprite = await ask_LLM(spritePrompt); // Chooses sprite
    const validSprite = await pickValidSprite(chosenSprite, `./assets/sprites/${general.sprite}`)
    const lastId = previousMessages[previousMessages.length - 1]?.id ?? 0; // Gets the last id, returns 0 if there's none
    // Push new interaction to memory
    const userMessage = {
      id: lastId + 1,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    const assistantMessage = {
      id: lastId + 2,
      role: 'assistant',
      content: result,
      sprite: validSprite,
      timestamp: new Date().toISOString()
    };
    previousMessages.push(userMessage, assistantMessage);
    await updateMemoryFile('./memory/short_term.json', previousMessages);

    // Generate diary every n messages, n must be even bc assistant has even number ids
    if (assistantMessage.id % 30 === 0) {
      try {
        const diaryPrompt = generateDiaryPrompt(personality);
        const contextWindow = previousMessages.slice(-8);
        const diaryEntry = await ask_LLM(diaryPrompt, '', contextWindow);
        const lastEntryId = previousEntries[previousEntries.length - 1]?.id ?? 0;
        previousEntries.push({
          id: lastEntryId + 1,
          role: 'assistant',
          content: 'Diary entry: ' + diaryEntry,
          timestamp: new Date().toISOString()
        });
        await updateMemoryFile('./memory/long_term.json', previousEntries);
      } catch (error) {
        console.error('Error during diary generation:', error);
      }
    }
    res.status(201).json(previousMessages[previousMessages.length - 1]);
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
    const jsonData = JSON.stringify({}, null, 2);
    await updateTextFile(jsonData, './memory/general.json', 'w');
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
    } else if (typeOfMemory === 'general') {
      const jsonData = JSON.stringify({}, null, 2);
      await updateTextFile(jsonData, './memory/general.json', 'w');
    } else {
      return res.status(404).json({ error: 'Not a valid memory type.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
});

export default router;