import OpenAI from 'openai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let API_KEY_DATA = {};
let openaiInstance = null;
const USER_CONFIG_PATH = path.resolve(__dirname, '../config/user_config.json');

function loadAndValidateConfig() {
    try {
        if (fs.existsSync(USER_CONFIG_PATH)) {
            const configFileContent = fs.readFileSync(USER_CONFIG_PATH, 'utf8');
            if (configFileContent.trim() !== '') {
                const parsedConfig = JSON.parse(configFileContent);
                // Validate essential keys
                if (parsedConfig.key && parsedConfig.base_url && parsedConfig.model) {
                    return parsedConfig;
                } else {
                    console.warn(`${USER_CONFIG_PATH} is missing essential fields (key, base_url, model).`);
                    return {}; // Return empty if fields are missing
                }
            } else {
                console.warn(`${USER_CONFIG_PATH} is empty.`);
                return {};
            }
        } else {
            console.warn(`${USER_CONFIG_PATH} not found.`);
            return {};
        }
    } catch (error) {
        console.error(`Error reading or parsing ${USER_CONFIG_PATH}:`, error.message);
        return {};
    }
}


function initializeOpenAI() {
    if (openaiInstance && API_KEY_DATA.key) return true; // Already initialized and valid

    API_KEY_DATA = loadAndValidateConfig();

    if (API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model) {
        try {
            openaiInstance = new OpenAI({
                baseURL: API_KEY_DATA.base_url,
                apiKey: API_KEY_DATA.key,
            });
            console.log("OpenAI client initialized successfully.");
            return true;
        } catch (e) {
            console.error("Error initializing OpenAI client with loaded config:", e.message);
            openaiInstance = null; // Ensure it's null on failure
            API_KEY_DATA = {}; // Clear invalid data
            return false;
        }
    } else {
        console.error('API key, base URL, or model is missing or invalid. OpenAI client not initialized.');
        openaiInstance = null;
        return false;
    }
}

// Export this function to be used by Routers.mjs
function isApiKeyEffectivelyConfigured() {
    if (!openaiInstance) {
        initializeOpenAI(); // This will try to load config and set openaiInstance
    }
    return !!(openaiInstance && API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model);
}


async function ask_LLM(prompt, instructions = '', memory = [], diary = []) {
    if (!openaiInstance) {
        if (!initializeOpenAI()) { // Try to initialize if not already
            console.error("ask_LLM: OpenAI client could not be initialized. Check configuration.");
            throw new Error("OpenAI client is not initialized. Please configure API Key via the application or check server logs.");
        }
    }
    
    // Ensure API_KEY_DATA is populated by initializeOpenAI
    if (!API_KEY_DATA.model) {
        console.error("ask_LLM: API_KEY_DATA.model is not set after initialization attempt.");
        throw new Error("OpenAI model configuration is missing. Please re-configure API Key.");
    }


    const messages = [];

    if (instructions) {
        messages.push({ role: "system", content: instructions });
    }
    if (memory.length > 0) {
        memory.forEach((entry) => messages.push({ role: entry.role, content: entry.content }));
    }
    if (diary.length > 0) {
        diary.forEach((entry) => messages.push({ role: entry.role, content: entry.content }));
    }
    messages.push({ role: "user", content: prompt });

    try {
        const completion = await openaiInstance.chat.completions.create({
            model: API_KEY_DATA.model,
            messages,
        });

        if (!completion || !completion.choices || !completion.choices[0]) {
            console.error("Invalid completion response:", completion);
            throw new Error("LLM response is invalid or empty.");
        }
        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error during LLM request:", error.message);
        // If the error is an APIError, it might contain more specific details
        if (error.constructor.name === 'APIError') {
            console.error("LLM API Error Details:", error.status, error.headers, error.error);
        }
        throw error; // Re-throw the error to be caught by the route handler
    }
}

export { ask_LLM, isApiKeyEffectivelyConfigured };