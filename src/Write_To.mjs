import { writeFile, appendFile } from 'node:fs/promises';

async function writeTo(data, path, mode) {
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

export default writeTo;