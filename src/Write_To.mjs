import { writeFile, appendFile } from 'node:fs/promises';

async function updateTextFile(data, path, mode) {
    try {
        if (mode === 'w') {
            await writeFile(path, data);
        } else if (mode === 'a') {
            await appendFile(path, data);
        } else {
            throw new Error('Incorrect mode: expected "w" or "a".');
        };
    } catch (err) {
        console.error(err);
    };
};

async function updateMemoryFile(path, memoryArray) {
  try {
    const json = JSON.stringify(memoryArray, null, 2); // Pretty print
    await writeFile(path, json);
  } catch (err) {
    console.error('Failed to write memory file:', err);
  }
}

export { updateTextFile, updateMemoryFile };