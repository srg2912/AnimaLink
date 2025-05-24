// Routers.mjs
import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'url';

import { updateTextFile, updateMemoryFile } from './Write_To.mjs';
import { readTextFile, readMemoryFile } from './Read_File.mjs';
import { generateInstructionPrompt,  generateSpritePrompt, generatePersonalityPrompt, generateDiaryPrompt } from './Generate_Prompt.mjs';
import { readContents, pickValidSprite, listFilesInDirectory } from './get_images.mjs'; 
import { ask_LLM, isApiKeyEffectivelyConfigured, getVisionSupportStatus, reloadConfigAndReinitializeClient, forceReinitializeOpenAI } from './LLM_Request.mjs';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirnameSrc = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirnameSrc, '..');

// Define paths based on PROJECT_ROOT
const USER_CONFIG_PATH = path.join(PROJECT_ROOT, 'config', 'user_config.json');
const USER_DATA_PATH = path.join(PROJECT_ROOT, 'config', 'user_data.json');
const PERSONALITY_PATH = path.join(PROJECT_ROOT, 'memory', 'personality.txt');
const GENERAL_MEMORY_PATH = path.join(PROJECT_ROOT, 'memory', 'general.json');
const SHORT_TERM_MEMORY_PATH = path.join(PROJECT_ROOT, 'memory', 'short_term.json');
const LONG_TERM_MEMORY_PATH = path.join(PROJECT_ROOT, 'memory', 'long_term.json');
const ASSETS_SPRITES_BASE_PATH = path.join(PROJECT_ROOT, 'assets', 'sprites');
const ASSETS_BACKGROUNDS_PATH = path.join(PROJECT_ROOT, 'assets', 'backgrounds'); 
const ASSETS_MUSIC_PATH = path.join(PROJECT_ROOT, 'assets', 'bg_music'); 
const BACKUPS_DIR_PATH = path.join(PROJECT_ROOT, 'backups');


// POST Request to get user's API
router.post('/api/api_key', async (req, res) => {
  const { model, key, endpoint, supports_vision } = req.body;

  if (!model || !key || !endpoint) return res.status(400).json({ error: 'One or more fields are empty.' });

  try {
    const configData = { 
        'model': model, 
        'key': key, 
        'base_url': endpoint, 
        'type': 'module',
        'supports_vision': !!supports_vision 
    };
    const jsonData = JSON.stringify(configData, null, 2);
    await updateTextFile(jsonData, USER_CONFIG_PATH, 'w');
    forceReinitializeOpenAI(); 
    res.status(201).json(configData);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'An error was produced when saving the data.' });
  }
});

// GET Request to check API Key configuration status and vision support
router.get('/api/status/api_key', (req, res) => {
  const configured = isApiKeyEffectivelyConfigured();
  const visionSupport = getVisionSupportStatus();
  if (configured) {
    res.status(200).json({ configured: true, supports_vision: visionSupport });
  } else {
    res.status(200).json({ configured: false, supports_vision: visionSupport, message: 'API Key not configured or is invalid.' });
  }
});

// PATCH request to update vision support specifically
router.patch('/api/config/vision', async (req, res) => {
    const { supports_vision } = req.body;

    if (typeof supports_vision !== 'boolean') {
        return res.status(400).json({ error: 'Invalid value for supports_vision. Must be boolean.' });
    }

    try {
        let currentConfig = {};
        try {
            const configFileContent = await readTextFile(USER_CONFIG_PATH);
            if (configFileContent && configFileContent.trim() !== '') {
                currentConfig = JSON.parse(configFileContent);
            }
        } catch (readError) {
            console.warn(`Could not read ${USER_CONFIG_PATH} before patching vision, will create/overwrite.`);
        }
        
        currentConfig.supports_vision = supports_vision;
        const jsonData = JSON.stringify(currentConfig, null, 2);
        await updateTextFile(jsonData, USER_CONFIG_PATH, 'w');
        
        const reloaded = reloadConfigAndReinitializeClient();
        if (!reloaded && currentConfig.key) {
             console.warn("LLM client failed to re-initialize after vision config update. May need full API key setup if not done.");
        }

        res.status(200).json({ message: 'Vision support updated successfully.', supports_vision: supports_vision });

    } catch (error) {
        console.error('Error updating vision support:', error);
        res.status(500).json({ error: 'Failed to update vision support configuration.' });
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
    await updateTextFile(jsonData, USER_DATA_PATH, 'w');
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

  const currentUserDataString = await readTextFile(USER_DATA_PATH);
  if (!currentUserDataString) return res.status(400).json({ error: 'No current data to edit.' });
  const currentUserData = JSON.parse(currentUserDataString);


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
      if (data[attribute] !== '' || attribute === 'name' || attribute === 'gender' || attribute === 'pronouns') {
        currentUserData[attribute] = data[attribute];
      }
    };
    if (!currentUserData.name) return res.status(400).json({ error: 'Cannot leave name empty.'});
    if (!currentUserData.gender) return res.status(400).json({ error: 'Cannot leave gender empty.'});
    if (!currentUserData.pronouns) return res.status(400).json({ error: 'Cannot leave pronouns empty.'});

    const jsonData = JSON.stringify(currentUserData, null, 2);
    await updateTextFile(jsonData, USER_DATA_PATH, 'w');
    res.status(200).json(currentUserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Couldn\'t save user\'s data.' });
  }
});

// DELETE Request to delete user's data
router.delete('/api/user_data', async (req, res) => {
  try {
    await updateTextFile('', USER_DATA_PATH, 'w');
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
    await updateTextFile(result, PERSONALITY_PATH, 'w');
    const jsonData = JSON.stringify({ 'name': name, 'looks': looks, 'sprite': sprite, 'language': language, 'rawPersonalityInput': personality }, null, 2); 
    await updateTextFile(jsonData, GENERAL_MEMORY_PATH, 'w');
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
    if (!edit || edit.trim() === '') { 
      return res.status(400).json({ error: 'Cannot leave personality empty.' });
    };
    await updateTextFile(edit, PERSONALITY_PATH, 'w');
    res.status(200).json({ characterProfile: edit }); 
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to edit character\'s personality.' });
  }
});

// POST Request to send a message to the character
router.post('/api/message', async (req, res) => {
  const { message, image_data } = req.body; 
  if (!message && !image_data) return res.status(400).json({ error: 'Message or image required.' });

  const personality =  await readTextFile(PERSONALITY_PATH);
  if (!personality) return res.status(400).json({ error: 'Personality required.' });

  const previousMessages = await readMemoryFile(SHORT_TERM_MEMORY_PATH);
  const userDataString = await readTextFile(USER_DATA_PATH);
  if (!userDataString) return res.status(400).json({ error: 'User data required.'});
  const user_data = JSON.parse(userDataString);
  
  const instruction = generateInstructionPrompt (personality, user_data);
  const previousEntries = await readMemoryFile(LONG_TERM_MEMORY_PATH);

  let llmPromptContent;
  if (image_data) {
    llmPromptContent = [];
    if (message) { 
        llmPromptContent.push({ type: "text", text: message });
    } else { 
        llmPromptContent.push({ type: "text", text: "The user sent this image. Describe it or react to it." });
    }
    llmPromptContent.push({ type: "image_url", image_url: { url: image_data } });
  } else {
    llmPromptContent = message;
  }

  try {
    const result = await ask_LLM(llmPromptContent, instruction, previousMessages, previousEntries); 
    
    const generalString = await readTextFile(GENERAL_MEMORY_PATH);
    if(!generalString) return res.status(400).json({ error: "Character general info not found."});
    const general = JSON.parse(generalString);

    const spritesString = await readContents(path.join(ASSETS_SPRITES_BASE_PATH, general.sprite)) 
    const spritePrompt = generateSpritePrompt (result, spritesString); 
    const chosenSprite = await ask_LLM(spritePrompt); 
    const validSprite = await pickValidSprite(chosenSprite, path.join(ASSETS_SPRITES_BASE_PATH, general.sprite));
    
    const lastId = previousMessages[previousMessages.length - 1]?.id ?? 0;
    
    const userMessageEntry = {
      id: lastId + 1,
      role: 'user',
      content: message || "[Image sent]", 
      image_data: image_data || null, 
      timestamp: new Date().toISOString()
    };
    const assistantMessageEntry = {
      id: lastId + 2,
      role: 'assistant',
      content: result,
      sprite: validSprite,
      timestamp: new Date().toISOString()
    };
    previousMessages.push(userMessageEntry, assistantMessageEntry);
    await updateMemoryFile(SHORT_TERM_MEMORY_PATH, previousMessages);

    // Diary and Backup logic
    if (assistantMessageEntry.id % 20 === 0) {
      try {
        const diaryPrompt = generateDiaryPrompt(personality);
        const contextWindow = previousMessages.slice(-20); 
        const diaryEntryContent = await ask_LLM(diaryPrompt, '', contextWindow);
        const lastEntryId = previousEntries[previousEntries.length - 1]?.id ?? 0;
        previousEntries.push({
          id: lastEntryId + 1,
          role: 'assistant', 
          content: 'Diary entry: ' + diaryEntryContent,
          timestamp: new Date().toISOString()
        });
        await updateMemoryFile(LONG_TERM_MEMORY_PATH, previousEntries);
      } catch (error) {
        console.error('Error during diary entry generation: ', error);
      }
    }

    if (assistantMessageEntry.id % 10 === 0) {
      try {
        const generalData = JSON.parse(await readTextFile(GENERAL_MEMORY_PATH)); 
        const shortTermData = JSON.parse(await readTextFile(SHORT_TERM_MEMORY_PATH));
        const longTermData = JSON.parse(await readTextFile(LONG_TERM_MEMORY_PATH));
        const personalityData = await readTextFile(PERSONALITY_PATH);
        const backupObject = { general: generalData, shortTerm: shortTermData, longTerm: longTermData, personality: personalityData };
        await updateMemoryFile(path.join(BACKUPS_DIR_PATH, `${generalData.name}_backup.json`), backupObject);
      } catch (error) {
        console.error('Error during backup generation: ', error);
      }
    }    

    res.status(201).json(assistantMessageEntry); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

// POST Request to interact with the character
router.post('/api/interact/:interaction_type', async (req, res) => {
  const interactionType = req.params.interaction_type;
  const { backgroundName } = req.body; 

  if (!interactionType) return res.status(400).json({ error: 'Interaction type not specified.' })
  
  let interactionMessage = '';
  // Default log message, can be overridden by specific interactions
  let userInteractionLogMessage = `System: User interacted by '${interactionType.replace(/_/g, ' ')}'.`;


  if (interactionType === 'hug') {
    interactionMessage = 'System Message: The user hugged your sprite.';
  } else if (interactionType === 'tickle') {
    interactionMessage = 'System Message: The user tickled your sprite on the ribs.';
  } else if (interactionType === 'kiss') {
    interactionMessage = 'System Message: The user kissed your sprite.';
  } else if (interactionType === 'pet_head') {
    interactionMessage = 'System Message: The user gently pets your head.';
    userInteractionLogMessage = 'System: User petted character on the head.';
  } else if (interactionType === 'hold_hand') {
    interactionMessage = 'System Message: The user wants to hold your hand.';
    userInteractionLogMessage = 'System: User wants to hold character\'s hand.';
  } else if (interactionType === 'high_five') {
    interactionMessage = 'System Message: The user wants to give you a high five.';
    userInteractionLogMessage = 'System: User initiated a high five.';
  } else if (interactionType === 'give_massage') {
    interactionMessage = 'System Message: The user gently starts to give you a shoulder massage.';
    userInteractionLogMessage = 'System: User is giving character a massage.';
  } else if (interactionType === 'background_change') {
    if (!backgroundName) {
        return res.status(400).json({ error: 'Background name not specified for background_change interaction.' });
    }
    const cleanBackgroundName = backgroundName.replace(/\.(png|jpe?g|gif|webp)$/i, '').replace(/_/g, ' ');
    interactionMessage = `System: The user took you to ${cleanBackgroundName}.`;
    userInteractionLogMessage = `System: User changed background to ${backgroundName}.`; 
  } else {
    // Fallback for any other interaction_type passed as a URL param, assuming it's a body part
    interactionMessage = `System Message: The user stroke your ${interactionType.replace(/_/g, ' ')} by interacting with your sprite.`;
  };

  if (!interactionMessage) return res.status(500).json({ error: 'Couldn\'t perform action or invalid interaction type.' })

  const personality =  await readTextFile(PERSONALITY_PATH);
  if (!personality) return res.status(400).json({ error: 'Personality required.' });

  const previousMessages = await readMemoryFile(SHORT_TERM_MEMORY_PATH);
  const userDataString = await readTextFile(USER_DATA_PATH);
  if (!userDataString) return res.status(400).json({ error: 'User data required.'});
  const user_data = JSON.parse(userDataString);

  const instruction = generateInstructionPrompt (personality, user_data); 
  const previousEntries = await readMemoryFile(LONG_TERM_MEMORY_PATH);

  try {
    const result = await ask_LLM(interactionMessage, instruction, previousMessages, previousEntries);
    const generalString = await readTextFile(GENERAL_MEMORY_PATH);
    if(!generalString) return res.status(400).json({ error: "Character general info not found."});
    const general = JSON.parse(generalString);

    const spritesString = await readContents(path.join(ASSETS_SPRITES_BASE_PATH, general.sprite));
    const spritePrompt = generateSpritePrompt (result, spritesString); 
    const chosenSprite = await ask_LLM(spritePrompt);
    const validSprite = await pickValidSprite(chosenSprite, path.join(ASSETS_SPRITES_BASE_PATH, general.sprite));
    const lastId = previousMessages[previousMessages.length - 1]?.id ?? 0;
    
    const userMessageEntry = { 
      id: lastId + 1,
      role: 'user', 
      content: userInteractionLogMessage, 
      timestamp: new Date().toISOString()
    };
    const assistantMessageEntry = {
      id: lastId + 2,
      role: 'assistant',
      content: result,
      sprite: validSprite,
      timestamp: new Date().toISOString()
    };
    previousMessages.push(userMessageEntry, assistantMessageEntry);
    await updateMemoryFile(SHORT_TERM_MEMORY_PATH, previousMessages);

    // Diary and Backup logic
     if (assistantMessageEntry.id % 20 === 0) { 
      try {
        const diaryPrompt = generateDiaryPrompt(personality);
        const contextWindow = previousMessages.slice(-20); 
        const diaryEntryContent = await ask_LLM(diaryPrompt, '', contextWindow);
        const lastEntryId = previousEntries[previousEntries.length - 1]?.id ?? 0;
        previousEntries.push({
          id: lastEntryId + 1,
          role: 'assistant',
          content: 'Diary entry: ' + diaryEntryContent,
          timestamp: new Date().toISOString()
        });
        await updateMemoryFile(LONG_TERM_MEMORY_PATH, previousEntries);
      } catch (error) {
        console.error('Error during diary entry generation: ', error);
      }
    }

    if (assistantMessageEntry.id % 10 === 0) {
       try {
        const generalData = JSON.parse(await readTextFile(GENERAL_MEMORY_PATH));
        const shortTermData = JSON.parse(await readTextFile(SHORT_TERM_MEMORY_PATH));
        const longTermData = JSON.parse(await readTextFile(LONG_TERM_MEMORY_PATH));
        const personalityData = await readTextFile(PERSONALITY_PATH);
        const backupObject = { general: generalData, shortTerm: shortTermData, longTerm: longTermData, personality: personalityData };
        await updateMemoryFile(path.join(BACKUPS_DIR_PATH, `${generalData.name}_backup.json`), backupObject);
      } catch (error) {
        console.error('Error during backup generation: ', error);
      }
    }    

    res.status(201).json(assistantMessageEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'LLM request failed.' });
  }
})

// DELETE Requests to reset memories
router.delete('/api/memory', async (req, res) => {
  try {
    await updateTextFile('', PERSONALITY_PATH, 'w');
    await updateMemoryFile(SHORT_TERM_MEMORY_PATH, []);
    await updateMemoryFile(LONG_TERM_MEMORY_PATH, []);
    const jsonData = JSON.stringify({}, null, 2);
    await updateTextFile(jsonData, GENERAL_MEMORY_PATH, 'w');
    return res.status(204).send(); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete all memories.' });
  }
});

router.delete('/api/memory/:type', async (req, res) => {
  const typeOfMemory = req.params.type;
  try {
    if (typeOfMemory === 'personality') {
      await updateTextFile('', PERSONALITY_PATH, 'w');
    } else if (typeOfMemory === 'shortTerm') {
      await updateMemoryFile(SHORT_TERM_MEMORY_PATH, []);
    } else if (typeOfMemory === 'longTerm') {
      await updateMemoryFile(LONG_TERM_MEMORY_PATH, []);
    } else if (typeOfMemory === 'general') {
      const jsonData = JSON.stringify({}, null, 2);
      await updateTextFile(jsonData, GENERAL_MEMORY_PATH, 'w');
    } else {
      return res.status(404).json({ error: 'Not a valid memory type.' });
    }
    return res.status(204).send(); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete memory.' });
  }
});

// GET Request to retrieve data from backup
router.get('/api/backups/:name', async (req, res) => {
  const name = req.params.name;
  if (!name) return res.status(400).json({ error: 'Bad request.' });
  const backupFilePath = path.join(BACKUPS_DIR_PATH, `${name}_backup.json`);

  try {
    const backupRaw = await readTextFile(backupFilePath);
    const backupObject = JSON.parse(backupRaw);

    if (!backupObject) return res.status(404).json({ error: 'Backup not found.' });

    const { general, shortTerm, longTerm, personality } = backupObject;

    await updateMemoryFile(SHORT_TERM_MEMORY_PATH, shortTerm);
    await updateMemoryFile(LONG_TERM_MEMORY_PATH, longTerm);
    await updateTextFile(JSON.stringify(general, null, 2), GENERAL_MEMORY_PATH, 'w');
    await updateTextFile(personality, PERSONALITY_PATH, 'w');

    res.status(200).json({ message: 'Memory restored successfully.' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ENOENT') { 
        return res.status(404).json({ error: 'Backup file not found.' });
    }
    res.status(500).json({ error: 'Failed to get backup.' });
  }
});

// GET Request to get short term memory
router.get('/api/memory/short_term', async (req, res) => {
  try {
    const messages = await readMemoryFile(SHORT_TERM_MEMORY_PATH, -1); 
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read short term memory.' });
  }
});

// GET Request to get long term memory
router.get('/api/memory/long_term', async (req, res) => {
  try {
    const entries = await readMemoryFile(LONG_TERM_MEMORY_PATH, -1); 
    res.status(200).json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read long term memory.' });
  }
});

// GET Request to retrieve user's data
router.get('/api/user_data', async (req, res) => {
  try {
    const userDataString = await readTextFile(USER_DATA_PATH);
    if (!userDataString || userDataString.trim() === '{}' || userDataString.trim() === '') {
        return res.status(404).json({ error: 'User data not found.' });
    }
    const userData = JSON.parse(userDataString);
    if (!userData.name || !userData.gender || !userData.pronouns) {
        return res.status(404).json({ error: 'User data incomplete.' });
    }
    res.status(200).json(userData);
  } catch (error) {
    if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'User data file not found.' });
    }
    res.status(404).json({ error: 'User data not found or is invalid.' });
  }
});

// GET Request to retrieve character's personality and general info
router.get('/api/personality', async (req, res) => {
  try {
    const personalityText = await readTextFile(PERSONALITY_PATH);
    const generalJsonString = await readTextFile(GENERAL_MEMORY_PATH);

    if (!personalityText || personalityText.trim() === '') {
        return res.status(404).json({ error: 'Character personality not found.' });
    }
    if (!generalJsonString || generalJsonString.trim() === '{}' || generalJsonString.trim() === '') {
        return res.status(404).json({ error: 'Character general info not found.' });
    }
    
    const generalData = JSON.parse(generalJsonString);
    if (!generalData.name || !generalData.sprite) {
        return res.status(404).json({ error: 'Character general info incomplete.' });
    }

    res.status(200).json({ 
        profile: personalityText, 
        general: generalData 
    });
  } catch (error) {
     if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Character profile or general info file not found.' });
    }
    res.status(404).json({ error: 'Character profile not found or is invalid.' });
  }
});

// GET Request to get list of available backgrounds
router.get('/api/backgrounds', (req, res) => {
  try {
    const allFiles = listFilesInDirectory(ASSETS_BACKGROUNDS_PATH);
    const imageFiles = allFiles.filter(file => /\.(png|jpe?g|gif|webp)$/i.test(file));
    res.status(200).json(imageFiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve background images list.' });
  }
});

// GET Request to get list of available music tracks
router.get('/api/music', (req, res) => {
  try {
    const allFiles = listFilesInDirectory(ASSETS_MUSIC_PATH);
    const musicFiles = allFiles.filter(file => /\.(mp3|wav|ogg)$/i.test(file));
    res.status(200).json(musicFiles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve music files list.' });
  }
});


// POST Request to manually create a backup
router.post('/api/backups/create', async (req, res) => {
    try {
        const generalString = await readTextFile(GENERAL_MEMORY_PATH);
        if (!generalString || generalString.trim() === '{}') {
            return res.status(404).json({ error: 'Character general info not found. Cannot create backup.' });
        }
        const generalData = JSON.parse(generalString);
        if (!generalData.name) {
            return res.status(400).json({ error: 'Character name not found in general info. Cannot create backup.' });
        }

        const shortTermData = JSON.parse(await readTextFile(SHORT_TERM_MEMORY_PATH));
        const longTermData = JSON.parse(await readTextFile(LONG_TERM_MEMORY_PATH));
        const personalityData = await readTextFile(PERSONALITY_PATH);
        
        const backupObject = { 
            general: generalData, 
            shortTerm: shortTermData, 
            longTerm: longTermData, 
            personality: personalityData 
        };
        
        const backupFilePath = path.join(BACKUPS_DIR_PATH, `${generalData.name}_backup.json`);
        await updateMemoryFile(backupFilePath, backupObject); 

        res.status(201).json({ message: `Backup for ${generalData.name} created successfully.`, filePath: backupFilePath });
    } catch (error) {
        console.error('Error during manual backup creation: ', error);
        if (error.code === 'ENOENT') {
            return res.status(500).json({ error: 'Failed to create backup: A required memory file is missing.' });
        }
        res.status(500).json({ error: 'Failed to create backup.' });
    }
});

export default router;