import { readFile } from 'node:fs/promises';

async function  readTextFile(path) {
  try {
    const data = await readFile(path, { encoding: 'utf8' });
    return data;
  } catch (err) {
    console.error(err);
  }
}

async function readMemoryFile(path, limit = 30) {
  try {
    const rawData = await readFile(path, { encoding: 'utf8' });
    const allMessages = JSON.parse(rawData);
    return allMessages.slice(-limit);
  } catch (err) {
    console.error('Failed to read memory file:', err);
    return [];
  }
}

export { readTextFile, readMemoryFile };