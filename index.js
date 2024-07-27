import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import cors from 'cors';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

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
    const auth = await authorize(); // Moved into try-catch
    const drive = google.drive({ version: 'v3', auth });

    const filePromises = req.files.map(file => {
      const fileMetadata = {
        name: file.originalname,
        parents: ['1afCB7Rj54oJIqdVhmK9ICRSWQn6iaXM6'], // Replace with your folder ID
      };

      const media = {
        body: Readable.from(file.buffer),
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
  try {
    const client_email = process.env.CLIENT_EMAIL;
    const private_key = process.env.PRIVATE_KEY;
    const SCOPE = ['https://www.googleapis.com/auth/drive'];
    const jwtClient = new google.auth.JWT(client_email, null, private_key, SCOPE);
    await jwtClient.authorize();
    return jwtClient;
  } catch (error) {
    console.error('Authorization error:', error); // Log authorization errors
    throw new Error('Authorization failed'); // Throw a generic error message
  }
};

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err); // Log error details
  res.status(500).json({ error: err.message }); // Respond with a generic error message
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
