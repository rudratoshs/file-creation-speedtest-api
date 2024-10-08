const express = require('express');
const aws = require('aws-sdk');
const cors = require('cors');
require('dotenv').config();

// AWS S3 configuration
const s3 = new aws.S3({
    accessKeyId: process.env.LEARNING_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.LEARNING_AWS_SECRET_ACCESS_KEY,
    region: process.env.LEARNING_AWS_REGION
});

const BUCKET_NAME = process.env.LEARNING_S3_BUCKET_NAME;
console.log('Using S3 Bucket:', BUCKET_NAME); // Added log for the bucket name
const app = express();
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

// Enable CORS for all routes
app.use(cors());

// Middleware to check if the requested file exists in S3 and serve or create it
app.get('/files/:fileName', async (req, res) => {
    const fileName = req.params.fileName;
    const fileSizeKB = parseInt(fileName.replace('KB.bin', '')); // Extract size from filename

    // Check if the file size exceeds 1 GB
    if (isNaN(fileSizeKB) || fileSizeKB * 1024 > MAX_FILE_SIZE_BYTES) {
        return res.status(400).send('Invalid or too large file size. Maximum allowed is 1GB.');
    }

    try {
        // Check if file already exists in S3
        await s3.headObject({
            Bucket: BUCKET_NAME,
            Key: fileName
        }).promise();

        // File exists, so generate a signed URL for download
        const url = s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Expires: 60 // URL valid for 60 seconds
        });
        return res.redirect(url);
    } catch (err) {
        if (err.code === 'NotFound') {
            // File doesn't exist, so create it
            const fileSizeBytes = fileSizeKB * 1024;
            const buffer = Buffer.alloc(fileSizeBytes); // Create a buffer with the specified size

            // Upload the file to S3 without ACL
            const params = {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: 'application/octet-stream'
                // Removed the ACL property
            };

            await s3.upload(params).promise();

            console.log(`Created and uploaded file: ${fileName} (${fileSizeKB} KB)`);

            // Generate a signed URL for the newly created file
            const url = s3.getSignedUrl('getObject', {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Expires: 60
            });

            return res.redirect(url);
        } else {
            console.error('Error fetching file from S3:', err);
            return res.status(500).send('Error fetching file from S3.');
        }
    }
});

// Route to list all available files in the S3 bucket
app.get('/files', async (req, res) => {
    try {
        const data = await s3.listObjectsV2({
            Bucket: BUCKET_NAME
        }).promise();

        if (!data.Contents.length) {
            return res.status(404).send('No files found.');
        }

        // Generate links for each file
        let fileLinks = data.Contents.map(file => {
            const url = s3.getSignedUrl('getObject', {
                Bucket: BUCKET_NAME,
                Key: file.Key,
                Expires: 60
            });
            return `<li><a href="${url}" download>${file.Key}</a></li>`;
        }).join('');

        res.send(`
            <h1>Download Files</h1>
            <ul>
                ${fileLinks}
            </ul>
        `);
    } catch (err) {
        console.error('Error listing files in S3:', err);
        return res.status(500).send('Error listing files in S3.');
    }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
