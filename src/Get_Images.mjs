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

// readContents('./assets/backgrounds').then(console.log);

export default readContents;