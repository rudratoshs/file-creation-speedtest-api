const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
const FILES_DIR = path.join(__dirname, 'files'); // Local folder to store files

// Ensure the 'files' directory exists
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR);
}

// Enable CORS for all routes
app.use(cors());

// Middleware to disable caching
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0'); // Date in the past
    next();
});

// Middleware to check if the requested file exists locally and serve or create it
app.get('/files/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(FILES_DIR, fileName);
    const fileSizeKB = parseInt(fileName.replace('KB.bin', '')); // Extract size from filename

    // Check if the file size exceeds 1 GB
    if (isNaN(fileSizeKB) || fileSizeKB * 1024 > MAX_FILE_SIZE_BYTES) {
        return res.status(400).send('Invalid or too large file size. Maximum allowed is 1GB.');
    }

    try {
        if (fs.existsSync(filePath)) {
            // File exists, serve it as a download
            return res.download(filePath);
        } else {
            // File doesn't exist, so create it
            const fileSizeBytes = fileSizeKB * 1024;
            const buffer = Buffer.alloc(fileSizeBytes); // Create a buffer with the specified size

            // Write the buffer to the local file system
            fs.writeFileSync(filePath, buffer);

            console.log(`Created and saved file: ${fileName} (${fileSizeKB} KB)`);

            // Serve the newly created file
            return res.download(filePath);
        }
    } catch (err) {
        console.error('Error fetching or creating file:', err);
        return res.status(500).send('Error fetching or creating file.');
    }
});

// Route to list all available files in the local 'files' directory
app.get('/files', (req, res) => {
    try {
        const files = fs.readdirSync(FILES_DIR);

        if (!files.length) {
            return res.status(404).send('No files found.');
        }

        // Generate links for each file
        let fileLinks = files.map(file => {
            return `<li><a href="/files/${file}" download>${file}</a></li>`;
        }).join('');

        res.send(`
            <h1>Download Files</h1>
            <ul>
                ${fileLinks}
            </ul>
        `);
    } catch (err) {
        console.error('Error listing files:', err);
        return res.status(500).send('Error listing files.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
