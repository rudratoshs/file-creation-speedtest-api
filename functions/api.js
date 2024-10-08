const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const serverless = require('serverless-http');
const router = express.Router();

const app = express();

// Enable CORS for all routes
app.use(cors());

// Define the writable directory where files are stored in serverless environment
const FILES_DIR = path.join('/tmp', 'files');

// Ensure that the files directory exists in the writable space
if (!fs.existsSync(FILES_DIR)) {
    fs.mkdirSync(FILES_DIR, { recursive: true });
    console.log(`Created directory: ${FILES_DIR}`);
}

// Middleware to check if the requested file exists and serve or create it
router.get('/files/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(FILES_DIR, fileName);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist, so create it
            const fileSizeKB = parseInt(fileName.replace('KB.bin', '')); // Extract size from filename
            if (!isNaN(fileSizeKB)) {
                const fileSizeBytes = fileSizeKB * 1024;
                const data = Buffer.alloc(fileSizeBytes); // Create a buffer with the specified size

                fs.writeFile(filePath, data, (err) => {
                    if (err) {
                        console.error('Error creating file:', err);
                        return res.status(500).send('Error creating file.');
                    }
                    console.log(`Created file: ${fileName} (${fileSizeKB} KB)`);
                    return res.download(filePath); // Serve the newly created file
                });
            } else {
                return res.status(400).send('Invalid file size in file name.');
            }
        } else {
            // File exists, serve it
            return res.download(filePath);
        }
    });
});

// Route to list all available files in the /tmp/files directory
router.get('/files', (req, res) => {
    fs.readdir(FILES_DIR, (err, files) => {
        if (err) {
            return res.status(500).send('Error reading directory.');
        }

        if (files.length === 0) {
            return res.status(404).send('No files found.');
        }

        // Generate links for each file
        let fileLinks = files.map(file => {
            return `<li><a href="/.netlify/functions/api/files/${file}" download>${file}</a></li>`;
        }).join('');

        res.send(`
            <h1>Download Files</h1>
            <ul>
                ${fileLinks}
            </ul>
        `);
    });
});

// Use the router for the serverless function
app.use('/.netlify/functions/api', router);

module.exports.handler = serverless(app);