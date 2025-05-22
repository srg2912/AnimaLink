import express from 'express';
import router from './src/Routers.mjs'; // Ensure this path is correct relative to app.mjs

const app = express();
const PORT = process.env.PORT || 3000;

// Increase payload size limits BEFORE other middleware that parses the body
// For JSON payloads (like the one you're likely using for image_data)
app.use(express.json({ limit: '10mb' }));
// For URL-encoded payloads (less likely for image data, but good to have)
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Use the routers
app.use(router);

// Use Assets
app.use(express.static('public'));
app.use('/assets', express.static('assets')); // Ensure this path is correct relative to app.mjs

// Server start
app.listen(PORT, () => {
    console.log(`Running on Port: ${PORT}`);
});