import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import cors from 'cors';
import dotenv from 'dotenv'; // Import dotenv
import { Readable } from 'stream'; // Import the stream module

dotenv.config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to handle JSON and URL-encoded data
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Your server is up!');
});

// Upload route
app.post('/api/upload', upload.array('files'), async (req, res, next) => {
  try {
    const auth = await authorize();
    const drive = google.drive({ version: 'v3', auth });

    const filePromises = req.files.map(file => {
      const fileMetadata = {
        name: file.originalname,
        parents: ['1afCB7Rj54oJIqdVhmK9ICRSWQn6iaXM6'], // Replace with your folder ID
      };

      const media = {
        body: Readable.from(file.buffer), // Convert Buffer to Readable stream
        mimeType: file.mimetype,
      };

      return drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id',
      });
    });

    const results = await Promise.all(filePromises);
    res.status(200).json({ files: results.map(result => result.data.id) });
  } catch (error) {
    console.error('Error in /api/upload route:', error); // Log error details
    next(error); // Pass the error to the error-handling middleware
  }
});

// Authorize function for Google Drive
const authorize = async () => {
  const client_email = process.env.client_email; 
  const private_key  = process.env.private_key; // Use environment variables
  const SCOPE = ['https://www.googleapis.com/auth/drive'];
  const jwtClient = new google.auth.JWT(client_email, null, private_key, SCOPE);
  await jwtClient.authorize();
  return jwtClient;
};

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err); // Log the error
  res.status(500).json({ error: 'Something went wrong, please try again later.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
