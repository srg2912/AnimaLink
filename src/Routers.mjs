import { Router } from 'express';
import { updateTextFile, updateMemoryFile } from './Write_To.mjs';
import { readTextFile, readMemoryFile } from './Read_File.mjs';
import { generateInstructionPrompt,  generateSpritePrompt, generatePersonalityPrompt, generateDiaryPrompt } from './Generate_Prompt.mjs';
import { readContents, pickValidSprite } from './get_images.mjs';
import { ask_LLM, isApiKeyEffectivelyConfigured } from './LLM_Request.mjs';

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
    const jsonData = JSON.stringify(data, null, 2);
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
    const jsonData = JSON.stringify(currentUserData, null, 2);
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

// POST Request to generate character's personality
router.post('/api/personality', async (req, res) => {
  const { name, personality, looks, language, sprite } = req.body;
  
  if (!name || !personality || !looks || !language || !sprite) return res.status(400).json({ error: 'One or more fields are empty.' });
  
  try {
    const personalityPrompt = generatePersonalityPrompt (name, looks, personality, language);
    const result = await ask_LLM(personalityPrompt);
    await updateTextFile(result, './memory/personality.txt', 'w');
    const jsonData = JSON.stringify({ 'name': name, 'looks': looks, 'sprite': sprite}, null, 2);
    await updateTextFile(jsonData, './memory/general.json', 'w');
    res.status(201).json({ characterProfile: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
});

// PATCH Request to manually edit character's personality
router.patch('/api/personality', async (req, res) => {
  const { edit } = req.body;
  try {
    if (!edit) {
      throw new Error('Cannot leave personality empty.');
    };
    await updateTextFile(edit, './memory/personality.txt', 'w');
    res.status(201).json({ characterProfile: edit });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to edit character\'s personality.' });
  }
});

// POST Request to send a message to the character
router.post('/api/message', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' }); // Validating message

  const personality =  await readTextFile('./memory/personality.txt');
  if (!personality) return res.status(400).json({ error: 'Personality required.' }); // Validating personality

  const previousMessages = await readMemoryFile('./memory/short_term.json');
  const user_data = await readTextFile('./config/user_data.json').then(JSON.parse); 
  const instruction = generateInstructionPrompt (personality, user_data);  // Generating prompt for character's behavior
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

    // Generate diary every n messages, n must be even because assistant has even number Ids
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
        console.error('Error during diary entry generation: ', error);
      }
    }

    // Generate a save file every n messages
    if (assistantMessage.id % 10 === 0) {
      try {
        const general = await readTextFile('./memory/general.json').then(JSON.parse);
        const shortTerm = await readTextFile('./memory/short_term.json').then(JSON.parse);
        const longTerm = await readTextFile('./memory/long_term.json').then(JSON.parse);
        const personality = await readTextFile('./memory/personality.txt')
        const backupObject = { general: general, shortTerm: shortTerm, longTerm: longTerm, personality: personality };
        await updateMemoryFile(`./backups/${general.name}_backup.json`, backupObject);
      } catch (error) {
        console.error('Error during backup generation: ', error);
      }
    }    

    res.status(201).json(previousMessages[previousMessages.length - 1]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

// POST Request to interact with the character, recicled logic of messaging
router.post('/api/interact/:body_part', async (req, res) => {
  const bodyPart = req.params.body_part;
  if (!bodyPart) return res.status(400).json({ error: 'Body part not specified.' })
  
  let message = ''
  if (bodyPart === 'hug') {
    message = 'System Message: The user hugged your sprite.';
  } else if (bodyPart === 'tickle') {
    message = 'System Message: The user tickled your sprite on the ribs.';
  } else if (bodyPart === 'kiss') {
    message = 'System Message: The user kissed your sprite.';
  } else {
    message = `System Message: The user stroke your ${bodyPart} by interacting with your sprite.`;
  };

  if (!message) return res.status(500).json({ error: 'couldn\' perform action.' })

  const personality =  await readTextFile('./memory/personality.txt');
  if (!personality) return res.status(400).json({ error: 'Personality required.' });

  const previousMessages = await readMemoryFile('./memory/short_term.json');
  const user_data = await readTextFile('./config/user_data.json').then(JSON.parse); 
  const instruction = generateInstructionPrompt (personality, user_data); 
  const previousEntries = await readMemoryFile('./memory/long_term.json');

  try {
    const result = await ask_LLM(message, instruction, previousMessages, previousEntries);
    const general = await readTextFile('./memory/general.json').then(JSON.parse); 
    const spritesString = await readContents(`./assets/sprites/${general.sprite}`)
    const spritePrompt = generateSpritePrompt (result, spritesString); 
    const chosenSprite = await ask_LLM(spritePrompt);
    const validSprite = await pickValidSprite(chosenSprite, `./assets/sprites/${general.sprite}`)
    const lastId = previousMessages[previousMessages.length - 1]?.id ?? 0;
    const userMessage = {
      id: lastId + 1,
      role: 'user',
      content: `System: User interaction.`,
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
        console.error('Error during diary entry generation: ', error);
      }
    }

    if (assistantMessage.id % 10 === 0) {
      try {
        const general = await readTextFile('./memory/general.json').then(JSON.parse);
        const shortTerm = await readTextFile('./memory/short_term.json').then(JSON.parse);
        const longTerm = await readTextFile('./memory/long_term.json').then(JSON.parse);
        const personality = await readTextFile('./memory/personality.txt')
        const backupObject = { general: general, shortTerm: shortTerm, longTerm: longTerm, personality: personality };
        await updateMemoryFile(`./backups/${general.name}_backup.json`, backupObject);
      } catch (error) {
        console.error('Error during backup generation: ', error);
      }
    }    

    res.status(201).json(previousMessages[previousMessages.length - 1]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

// DELETE Requests to reset memories
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

// GET Request to retrieve data from backup
router.get('/api/backups/:name', async (req, res) => {
  const name = req.params.name;
  if (!name) return res.status(400).json({ error: 'Bad request.' });

  try {
    const backupRaw = await readTextFile(`./backups/${name}_backup.json`);
    const backupObject = JSON.parse(backupRaw);

    if (!backupObject) return res.status(404).json({ error: 'Backup not found.' });

    const { general, shortTerm, longTerm, personality } = backupObject;

    await updateMemoryFile('./memory/short_term.json', shortTerm);
    await updateMemoryFile('./memory/long_term.json', longTerm);
    await updateTextFile(JSON.stringify(general, null, 2), './memory/general.json', 'w');
    await updateTextFile(personality, './memory/personality.txt', 'w');

    res.status(200).json({ message: 'Memory restored successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get backup.' });
  }
});

// GET Request to get short term memory
router.get('/api/memory/short_term', async (req, res) => {
  try {
    const messages = await readMemoryFile('./memory/short_term.json', -1);
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read short term memory.' });
  }
});

// GET Request to get long term memory
router.get('/api/memory/long_term', async (req, res) => {
  try {
    const entries = await readMemoryFile('./memory/long_term.json', -1);
    res.status(200).json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read long term memory.' });
  }
});

// GET Request to retrieve user's data
router.get('/api/user_data', async (req, res) => {
  try {
    const userDataString = await readTextFile('./config/user_data.json');
    // Check if the file content is empty, just {} or doesn't exist (readTextFile might return undefined or throw)
    if (!userDataString || userDataString.trim() === '{}' || userDataString.trim() === '') {
        return res.status(404).json({ error: 'User data not found.' });
    }
    const userData = JSON.parse(userDataString);
    // Check for essential fields
    if (!userData.name || !userData.gender || !userData.pronouns) {
        return res.status(404).json({ error: 'User data incomplete.' });
    }
    res.status(200).json(userData);
  } catch (error) {
    // This catch block handles errors from readTextFile (e.g., file not found) 
    // and JSON.parse (e.g., file is not valid JSON)
    // console.error("Error in GET /api/user_data:", error.message); // Log specific error
    res.status(404).json({ error: 'User data not found or is invalid.' });
  }
});

// GET Request to retrieve character's personality and general info
router.get('/api/personality', async (req, res) => {
  try {
    const personalityText = await readTextFile('./memory/personality.txt');
    const generalJsonString = await readTextFile('./memory/general.json');

    if (!personalityText || personalityText.trim() === '') {
        return res.status(404).json({ error: 'Character personality not found.' });
    }
    if (!generalJsonString || generalJsonString.trim() === '{}' || generalJsonString.trim() === '') {
        return res.status(404).json({ error: 'Character general info not found.' });
    }
    
    const generalData = JSON.parse(generalJsonString);
    // Check for essential fields in general.json
    if (!generalData.name || !generalData.sprite) {
        return res.status(404).json({ error: 'Character general info incomplete.' });
    }

    res.status(200).json({ 
        profile: personalityText, 
        general: generalData 
    });
  } catch (error) {
    // console.error("Error in GET /api/personality:", error.message);
    res.status(404).json({ error: 'Character profile not found or is invalid.' });
  }
});

// GET Request to check API Key configuration status
router.get('/api/status/api_key', (req, res) => {
  if (isApiKeyEffectivelyConfigured()) {
    res.status(200).json({ configured: true });
  } else {
    // Use 404 or another appropriate status if "not configured" is the primary meaning
    res.status(200).json({ configured: false, message: 'API Key not configured or is invalid.' });
    // Using 200 for "successfully checked, result is false" rather than 404 "resource not found"
  }
});

export default router;