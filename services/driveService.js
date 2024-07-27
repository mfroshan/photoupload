// services/driveService.js

import { google } from 'googleapis';
import credentials from '../key.json' assert { type: 'json' };

const SCOPE = ['https://www.googleapis.com/auth/drive'];

// Authorize with Google Drive API
export async function authorize() {
    const jwtClient = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        SCOPE
    );

    await jwtClient.authorize();
    return jwtClient;
}

// Upload file to Google Drive
export async function uploadFile(authClient, file) {
    return new Promise((resolve, reject) => {
        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetadata = {
            name: file.originalname,  // For Express.js
            parents: ['1afCB7Rj54oJIqdVhmK9ICRSWQn6iaXM6'], // Replace with your folder ID
        };

        drive.files.create(
            {
                resource: fileMetadata,
                media: {
                    body: file.buffer,  // Buffer from multer
                    mimeType: file.mimetype,
                },
                fields: 'id',
            },
            (error, response) => {
                if (error) {
                    return reject(error);
                }
                resolve(response.data);
            }
        );
    });
}
