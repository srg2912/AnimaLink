import { readFile } from 'node:fs/promises';

async function readData(path) {
  try {
    const data = await readFile(path, { encoding: 'utf8' });
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}

export default readData;