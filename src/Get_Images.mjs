import fsPromises from 'node:fs/promises'; // For async operations
import fs from 'node:fs'; // For sync operations (like readdirSync)
import path from 'node:path'; // Often useful, though not directly used in this snippet

async function readContents (directoryPath) {
    try {
        const data = await fsPromises.readdir(directoryPath); // Use async readdir
        if (!data) { // readdir returns array or throws, so this check might be redundant
            throw new Error ('Couldn\'t read contents of directory.');
        };
        return data.join(','); // Return comma-separated string of filenames
    } catch (error) {
        console.error(`Error reading contents of ${directoryPath}:`, error);
        return ""; // Return empty string on error or if directory is empty
    }
}

const pickFallbackSprite = (spriteList) => { // spriteList is an array of filenames
    if (!spriteList || spriteList.length === 0) {
        console.warn("pickFallbackSprite called with empty or invalid spriteList. Defaulting to 'normal.png'.");
        return 'normal.png'; 
    }
    return spriteList.includes('normal.png')
        ? 'normal.png'
        : spriteList[Math.floor(Math.random() * spriteList.length)];
};

const pickValidSprite = async (rawResponse, spriteDirectoryPath) => {
    try {
        const spriteList = await fsPromises.readdir(spriteDirectoryPath); // async readdir
        const cleaned = rawResponse ? rawResponse.trim().replace(/^"|"$/g, '') : "";
        
        if (spriteList.length === 0) {
            console.warn(`No sprites found in directory: ${spriteDirectoryPath}. Falling back to 'normal.png'.`);
            return 'normal.png';
        }
        if (!cleaned) {
            console.warn(`LLM returned empty sprite choice from list: [${spriteList.join(', ')}]. Falling back for dir: ${spriteDirectoryPath}`);
            return pickFallbackSprite(spriteList);
        }

        return spriteList.includes(cleaned)
            ? cleaned
            : pickFallbackSprite(spriteList);
    } catch (error) {
        console.error(`Error in pickValidSprite for path ${spriteDirectoryPath}:`, error.message);
        return 'normal.png'; // Fallback if there's an error
    }
};

// This function is used by GET /api/backgrounds and GET /api/music which are synchronous route handlers.
function listFilesInDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath); // Synchronous
        return files || [];
    } catch (error) {
        // Log less severe if directory simply not found, more severe for other errors
        if (error.code === 'ENOENT') {
            // console.warn(`Directory not found for listing files: ${directoryPath}`); // Can be noisy
        } else {
            console.error(`Error reading directory ${directoryPath}:`, error.message);
        }
        return [];
    }
}

export { readContents, pickValidSprite, listFilesInDirectory };