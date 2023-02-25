const express = require('express');
const path = require('path');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const app = express();
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));


app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
})


app.get('/sendResume', (req, res) => {
    const sendFiles = path.join(publicPath, 'sendFiles.html');
    res.sendFile(sendFiles);
});

// Setup storage
const storage = new Storage({
    projectId: 'modified-petal-378800',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

// Configure multer to handle file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Handle file upload requests
app.post('/upload', upload.single('resume'), async (req, res) => {
    // Get the uploaded file
    const resumeFile = req.file;

    // Get the input values from the form
    const name = req.body.name;
    const address = req.body.address;

    // Create a new filename for the uploaded file
    const fileName = `${Date.now()}-${path.basename(resumeFile.originalname)}`;

    // Upload the file to Google Cloud Storage
    const bucketName = 'thanhly-bucket';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
        metadata: {
            contentType: resumeFile.mimetype,
            metadata: {
                originalname: resumeFile.originalname,
                name: name,
                address: address,
            },
        },
        resumable: false,
    });
    stream.on('error', (err) => {
        console.error(`Error uploading file to Google Cloud Storage: ${err}`);
        res.status(500).send('Error uploading file to Google Cloud Storage');
    });
    stream.on('finish', () => {
        console.log(`File uploaded to Google Cloud Storage: ${fileName}`);
        res.status(200).send('File uploaded successfully');
    });
    stream.end(resumeFile.buffer);
});







// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});