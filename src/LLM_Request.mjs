import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let API_KEY_DATA = {}; // Initialize as empty object
let openaiInstance = null;
const USER_CONFIG_PATH = path.resolve(__dirname, '../config/user_config.json');

// Function to load and validate config, returns the config object or an empty one with defaults
function loadAndValidateConfig() {
    try {
        if (fs.existsSync(USER_CONFIG_PATH)) {
            const configFileContent = fs.readFileSync(USER_CONFIG_PATH, 'utf8');
            if (configFileContent.trim() !== '') {
                const parsedConfig = JSON.parse(configFileContent);
                if (parsedConfig.key && parsedConfig.base_url && parsedConfig.model) {
                    return { 
                        ...parsedConfig, 
                        supports_vision: parsedConfig.supports_vision || false 
                    };
                } else {
                    console.warn(`${USER_CONFIG_PATH} is missing essential fields (key, base_url, model).`);
                    return { key: null, base_url: null, model: null, supports_vision: false }; 
                }
            } else {
                console.warn(`${USER_CONFIG_PATH} is empty.`);
                return { key: null, base_url: null, model: null, supports_vision: false };
            }
        } else {
            console.warn(`${USER_CONFIG_PATH} not found.`);
            return { key: null, base_url: null, model: null, supports_vision: false };
        }
    } catch (error) {
        console.error(`Error reading or parsing ${USER_CONFIG_PATH}:`, error.message);
        return { key: null, base_url: null, model: null, supports_vision: false };
    }
}

// Load config immediately when module is loaded.
API_KEY_DATA = loadAndValidateConfig();

function initializeOpenAI(forceReload = false) {
    if (forceReload || !API_KEY_DATA.key) {
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
            API_KEY_DATA = loadAndValidateConfig();
            return false;
        }
    } else {
        console.error('API key, base URL, or model is missing or invalid from config. OpenAI client not initialized.');
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
        initializeOpenAI();
    }
    return !!(openaiInstance && API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model);
}

function getVisionSupportStatus() {
    // API_KEY_DATA is loaded at module start and reloaded by initializeOpenAI
    return API_KEY_DATA.supports_vision || false;
}


async function ask_LLM(promptContent, instructions = '', memory = [], diary = []) {
    if (!isApiKeyEffectivelyConfigured()) { // This will also attempt to initialize
        console.error("ask_LLM: OpenAI client could not be initialized. Check configuration.");
        throw new Error("OpenAI client is not initialized. Please configure API Key via the application or check server logs.");
    }
    
    // API_KEY_DATA.model should be set if isApiKeyEffectivelyConfigured returned true
    if (!API_KEY_DATA.model) {
        console.error("ask_LLM: API_KEY_DATA.model is not set after successful configuration check.");
        throw new Error("OpenAI model configuration is missing despite client appearing configured. Please re-configure API Key.");
    }

    const messages = [];
    // ... (rest of ask_LLM)
    if (instructions) {
        messages.push({ role: "system", content: instructions });
    }
    if (memory.length > 0) {
        // Ensure memory entries have role and content
        memory.forEach((entry) => {
            if (entry && entry.role && entry.content !== undefined) {
                messages.push({ role: entry.role, content: entry.content });
            } else {
                console.warn("Skipping invalid memory entry:", entry);
            }
        });
    }
    if (diary.length > 0) {
         diary.forEach((entry) => {
            if (entry && entry.role && entry.content !== undefined) {
                messages.push({ role: entry.role, content: entry.content });
            } else {
                console.warn("Skipping invalid diary entry:", entry);
            }
        });
    }
    
    messages.push({ role: "user", content: promptContent });

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
        if (error.constructor.name === 'APIError') {
            console.error("LLM API Error Details:", error.status, error.headers, error.error);
        }
        throw error; 
    }
}

// Export forceReinitializeOpenAI as initializeOpenAI with forceReload=true
export { ask_LLM, isApiKeyEffectivelyConfigured, getVisionSupportStatus, reloadConfigAndReinitializeClient, initializeOpenAI as forceReinitializeOpenAI };