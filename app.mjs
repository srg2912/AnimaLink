import express from 'express';
import router from './src/Routers.mjs';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON
app.use(express.json());

// Use the routers
app.use(router);

// Use Assets
app.use(express.static('public'));
app.use('/assets', express.static('assets'))

// Server start
app.listen(PORT, () => {
    console.log(`Running on Port: ${PORT}`);
})