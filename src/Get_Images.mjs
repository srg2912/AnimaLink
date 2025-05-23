import fs from 'node:fs';

async function readContents (path) {
    try {
        const data = fs.readdirSync(path);
        if (!data) {
            throw new Error ('Couldn\'t read contents of file.');
        };
        return data.toString();
    } catch (error) {
        console.log(error);
    }
}

const pickFallbackSprite = (spriteList) => {
    return spriteList.includes('normal.png')
        ? 'normal.png'
        : spriteList[Math.floor(Math.random() * spriteList.length)];
};

const pickValidSprite = async (rawResponse, path) => {
    try {
        const spriteList = fs.readdirSync(path)
        const cleaned = rawResponse.trim().replace(/^"|"$/g, '');
        if (spriteList.length === 0 || !cleaned) {
            throw new Error ('Couldn\'t pick a valid sprite.')
        }
        return spriteList.includes(cleaned)
            ? cleaned
            : pickFallbackSprite(spriteList);
    } catch (error) {
        console.log(error)
    }
};

// New function to list files in a directory, returning an array
function listFilesInDirectory(directoryPath) {
    try {
        const files = fs.readdirSync(directoryPath);
        return files || []; // Ensure an array is returned
    } catch (error) {
        console.error(`Error reading directory ${directoryPath}:`, error.message);
        return []; // Return empty array on error
    }
}

export { readContents, pickValidSprite, listFilesInDirectory };