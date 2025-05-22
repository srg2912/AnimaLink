// LLM_Request.mjs

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
                    // Also load supports_vision, defaulting to false if not present
                    return { ...parsedConfig, supports_vision: parsedConfig.supports_vision || false };
                } else {
                    console.warn(`${USER_CONFIG_PATH} is missing essential fields (key, base_url, model).`);
                    return { supports_vision: false }; 
                }
            } else {
                console.warn(`${USER_CONFIG_PATH} is empty.`);
                return { supports_vision: false };
            }
        } else {
            console.warn(`${USER_CONFIG_PATH} not found.`);
            return { supports_vision: false };
        }
    } catch (error) {
        console.error(`Error reading or parsing ${USER_CONFIG_PATH}:`, error.message);
        return { supports_vision: false };
    }
}

function initializeOpenAI() {
    // Always reload config data when attempting initialization
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
            openaiInstance = null; 
            API_KEY_DATA = { supports_vision: false }; // Clear invalid data but keep vision default
            return false;
        }
    } else {
        console.error('API key, base URL, or model is missing or invalid. OpenAI client not initialized.');
        openaiInstance = null;
        return false;
    }
}

// Call this function after user_config.json is updated by Routers.mjs
function reloadConfigAndReinitializeClient() {
    console.log("Reloading configuration and reinitializing OpenAI client...");
    return initializeOpenAI(); // This will now re-load and re-initialize
}

function isApiKeyEffectivelyConfigured() {
    if (!openaiInstance || !API_KEY_DATA.key) { // Check instance and key specifically
        initializeOpenAI(); 
    }
    return !!(openaiInstance && API_KEY_DATA.key && API_KEY_DATA.base_url && API_KEY_DATA.model);
}

function getVisionSupportStatus() {
    if (!API_KEY_DATA) { // Ensure API_KEY_DATA is loaded if not already
        API_KEY_DATA = loadAndValidateConfig();
    }
    return API_KEY_DATA.supports_vision || false;
}


async function ask_LLM(promptContent, instructions = '', memory = [], diary = []) {
    if (!openaiInstance) {
        if (!initializeOpenAI()) { 
            console.error("ask_LLM: OpenAI client could not be initialized. Check configuration.");
            throw new Error("OpenAI client is not initialized. Please configure API Key via the application or check server logs.");
        }
    }
    
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
    
    // promptContent can be a string (text-only) or an array for vision models
    messages.push({ role: "user", content: promptContent });

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
        if (error.constructor.name === 'APIError') {
            console.error("LLM API Error Details:", error.status, error.headers, error.error);
        }
        throw error; 
    }
}

export { ask_LLM, isApiKeyEffectivelyConfigured, getVisionSupportStatus, reloadConfigAndReinitializeClient, initializeOpenAI as forceReinitializeOpenAI };