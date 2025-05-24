import express from 'express';
import router from './src/Routers.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// For JSON payloads
app.use(express.json({ limit: '10mb' }));
// For URL-encoded payloads
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Use the routers
app.use(router);

// Use Assets
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Server start
app.listen(PORT, () => {
    console.log(`Running on Port: ${PORT}`);
});