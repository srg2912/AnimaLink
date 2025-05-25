import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';

let API_KEY_DATA = {};
let openaiInstance = null;
let USER_CONFIG_PATH_INTERNAL = ''; // Cache for the config path

function getUserConfigPath() {
    if (USER_CONFIG_PATH_INTERNAL) {
        return USER_CONFIG_PATH_INTERNAL;
    }
    const userDataEnvPath = process.env.USER_DATA_PATH;
    if (!userDataEnvPath) {
        console.error("LLM_Request: USER_DATA_PATH environment variable not found. Cannot locate config file.");
        return path.join('__error_USER_DATA_PATH_not_set__', 'config', 'user_config.json');
    }
    USER_CONFIG_PATH_INTERNAL = path.join(userDataEnvPath, 'config', 'user_config.json');
    return USER_CONFIG_PATH_INTERNAL;
}

function loadAndValidateConfig() {
    const configPath = getUserConfigPath();
    try {
        if (fs.existsSync(configPath)) {
            const configFileContent = fs.readFileSync(configPath, 'utf8');
            if (configFileContent.trim() !== '') {
                const parsedConfig = JSON.parse(configFileContent);
                if (parsedConfig.key && parsedConfig.base_url && parsedConfig.model) {
                    return {
                        ...parsedConfig,
                        supports_vision: parsedConfig.supports_vision || false
                    };
                } else {
                    console.warn(`${configPath} is missing essential fields (key, base_url, model). Using defaults.`);
                    return { key: null, base_url: null, model: null, supports_vision: false };
                }
            } else {
                console.warn(`${configPath} is empty. Using defaults.`);
                return { key: null, base_url: null, model: null, supports_vision: false };
            }
        } else {
            return { key: null, base_url: null, model: null, supports_vision: false };
        }
    } catch (error) {
        console.error(`Error reading or parsing ${configPath}:`, error.message);
        return { key: null, base_url: null, model: null, supports_vision: false };
    }
}

// Load config when module is first imported.
API_KEY_DATA = loadAndValidateConfig();

function initializeOpenAI(forceReload = false) {
    const configPath = getUserConfigPath(); // Ensures path is known

    if (forceReload || !API_KEY_DATA.key || !fs.existsSync(configPath)) {
        API_KEY_DATA = loadAndValidateConfig();
    }

    if (API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model) {
        try {
            openaiInstance = new OpenAI({
                baseURL: API_KEY_DATA.base_url,
                apiKey: API_KEY_DATA.key,
            });
            console.log("OpenAI client initialized/re-initialized successfully.");
            return true;
        } catch (e) {
            console.error("Error initializing OpenAI client with loaded config:", e.message);
            openaiInstance = null;
            API_KEY_DATA = { key: null, base_url: null, model: null, supports_vision: false }; // Reset to safe state
            return false;
        }
    } else {
        // Only log error if config file exists or some data was partially loaded, to avoid noise on first setup
        if (fs.existsSync(configPath) || (API_KEY_DATA.key || API_KEY_DATA.base_url || API_KEY_DATA.model)) {
             console.warn('API key, base URL, or model is missing or invalid from config. OpenAI client not initialized.');
        }
        openaiInstance = null;
        return false;
    }
}

function reloadConfigAndReinitializeClient() {
    console.log("Reloading configuration and reinitializing OpenAI client...");
    return initializeOpenAI(true);
}

function isApiKeyEffectivelyConfigured() {
    if (!openaiInstance || !API_KEY_DATA.key || !API_KEY_DATA.base_url || !API_KEY_DATA.model) {
        initializeOpenAI(); // Attempt to initialize if not already or if critical data is missing
    }
    return !!(openaiInstance && API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model);
}

function getVisionSupportStatus() {
    // Ensure API_KEY_DATA is up-to-date, especially for supports_vision flag
    if (!API_KEY_DATA.key && !API_KEY_DATA.base_url && !API_KEY_DATA.model) {
        initializeOpenAI(); // Attempt to load config if not already
    }
    return API_KEY_DATA.supports_vision || false;
}


async function ask_LLM(promptContent, instructions = '', memory = [], diary = []) {
    if (!isApiKeyEffectivelyConfigured()) {
        console.error("ask_LLM: OpenAI client could not be initialized. Check configuration.");
        throw new Error("OpenAI client is not initialized. Please configure API Key via the application or check server logs.");
    }
    
    if (!API_KEY_DATA.model) {
        console.error("ask_LLM: API_KEY_DATA.model is not set after successful configuration check.");
        throw new Error("OpenAI model configuration is missing despite client appearing configured. Please re-configure API Key.");
    }

    const messages = [];
    if (instructions) {
        messages.push({ role: "system", content: instructions });
    }
    memory.forEach((entry) => {
        if (entry && entry.role && entry.content !== undefined) {
            messages.push({ role: entry.role, content: entry.content });
        } else {
            console.warn("Skipping invalid memory entry:", entry);
        }
    });
    diary.forEach((entry) => {
        if (entry && entry.role && entry.content !== undefined) {
            messages.push({ role: entry.role, content: entry.content });
        } else {
            console.warn("Skipping invalid diary entry:", entry);
        }
    });
    
    // Handle complex promptContent (for vision)
    if (Array.isArray(promptContent)) {
        if (API_KEY_DATA.supports_vision) { // Check if current model setup supports vision
             messages.push({ role: "user", content: promptContent });
        } else {
            const textPart = promptContent.find(part => part.type === "text");
            if (textPart && textPart.text) {
                messages.push({ role: "user", content: textPart.text });
                 console.warn("Vision model not supported or configured; image data provided but ignored. Sending text part only.");
            } else {
                messages.push({ role: "user", content: "[Image was sent, but vision is not supported by the current model or no text was provided with the image]"});
                console.warn("Vision model not supported or configured; image data provided but ignored. No text part found.");
            }
        }
    } else { // Standard text prompt
        messages.push({ role: "user", content: promptContent });
    }

    try {
        const completion = await openaiInstance.chat.completions.create({
            model: API_KEY_DATA.model,
            messages,
        });

        if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
            console.error("Invalid completion response structure:", completion);
            throw new Error("LLM response is invalid, empty, or has unexpected structure.");
        }
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error during LLM request:", error.message);
        if (error.constructor.name === 'APIError' && error.status) { // Check for OpenAI's specific error structure
            console.error("LLM API Error Details:", error.status, error.headers, error.error);
        }
        throw error; 
    }
}

export { ask_LLM, isApiKeyEffectivelyConfigured, getVisionSupportStatus, reloadConfigAndReinitializeClient, initializeOpenAI as forceReinitializeOpenAI };