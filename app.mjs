import express from 'express';
import createRouter from './src/Routers.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const userDataPath = process.env.USER_DATA_PATH;
if (!userDataPath) {
    console.error("FATAL: USER_DATA_PATH environment variable not set. Express app cannot start correctly.");
    process.exit(1);
}
console.log(`Express app using userDataPath: ${userDataPath}`);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

console.log(`app.mjs __dirname: ${__dirname}`);
const publicPath = path.join(__dirname, 'public');
console.log(`Serving static files from publicPath: ${publicPath}`);
app.use(express.static(publicPath));


// Serve assets (sprites, backgrounds, music) from the userDataPath/assets directory
const userAssetsPath = path.join(userDataPath, 'assets');
console.log(`Serving user modifiable assets from /assets mapped to ${userAssetsPath}`);
app.use('/assets', express.static(userAssetsPath));

const router = createRouter(userDataPath);
app.use(router);

app.listen(PORT, () => {
    console.log(`Express server running on Port: ${PORT}`);
    if (typeof process.send === 'function') {
        process.send('server-started');
    }
});