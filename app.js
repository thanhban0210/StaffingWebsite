const express = require('express');
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();
const { Client } = require('pg');


const app = express();
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));




app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'))
})


app.get('/send-resume', (req, res) => {
    const sendFiles = path.join(publicPath, 'send-resume.html');
    res.sendFile(sendFiles);
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(publicPath, 'about.html'))
})

app.get('/software-engineer-role', (req, res) => {
    res.sendFile(path.join(publicPath, 'software-engineer.html'))
})
app.get('/project-manager-role', (req, res) => {
    res.sendFile(path.join(publicPath, 'project-manager.html'))
})

// Setup connection to database
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432, // default PostgreSQL port
});

const client = new Client({
    connectionString: process.env.ELEPHANTSQL_CONNECTION,
    ssl: {
        rejectUnauthorized: false
    }
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
    // // Get the input values from the form
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const address = req.body.address;
    const city = req.body.city;
    const state = req.body.state;
    const zipcode = req.body.zipcode;
    const phone = req.body.phone
    const email = req.body.email;
    const date = new Date(Date.now());
    const formatedDate = date.toLocaleDateString('en-US');
    console.log([firstName, lastName, address, city, state, zipcode, phone, email])
    // // Create a new filename for the uploaded file
    const fileName = `${formatedDate}-${path.basename(resumeFile.originalname)}`;

    // // Upload the file to Google Cloud Storage
    const bucketName = 'thanhly-bucket';
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
        metadata: {
            contentType: resumeFile.mimetype,
            metadata: {
                originalname: resumeFile.originalname,
                name: firstName,
                address: address,
            },
        },
        resumable: false,
    });

    stream.on('error', (err) => {
        console.error(`Error uploading file to Google Cloud Storage: ${err}`);
        res.status(500).send('Error uploading file to Google Cloud Storage');
    });

    stream.on('finish', async () => {
        console.log(`File uploaded to Google Cloud Storage: ${fileName}`);
        const url = await file.publicUrl();
        client.connect((err) => {
            if (err) {
                console.error('Error connecting to database', err);
            } else {
                console.log('Connected to database');
            }
        });
        client.query('INSERT INTO resume (first_name, last_name, address, city, state, zipcode, phone, email, resume_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [firstName, lastName, address, city, state, zipcode, phone, email, url]
            , (err, res) => {
                if (err) {
                    console.error('Error running query', err);
                } else {
                    console.log('Insert successfully');
                }
            });

        const alertHtml = `
      <script>alert("Thank you for joining us! We will contact you soon.");window.location.href="/";</script>
    `;
        res.send(
            alertHtml
        );
    });
    stream.end(resumeFile.buffer);
});






// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
});