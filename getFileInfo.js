const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load client secrets from a service account
const keyFilePath = path.join(__dirname, 'coursemagic-33154da49918.json');
const rawData = fs.readFileSync(keyFilePath);
const keys = JSON.parse(rawData);

// Initialize the Google Drive API client
const auth = new google.auth.JWT(
  keys.client_email,
  null,
  keys.private_key,
  ['https://www.googleapis.com/auth/drive.metadata.readonly']
);

const drive = google.drive({ version: 'v2', auth });

// Fetch file metadata by its ID
async function getFileMetadata() {
  try {
    const fileId = '10m8kwW04FYLIY2nY4KyRIEPhHpRnrAXmWtckU7pgQKo'; // Replace with your file ID
    const response = await drive.files.get({ fileId });
    const fileMetadata = response.data;
    console.log(`Response: ${JSON.stringify(response)}}`)
    console.log('File Metadata:', fileMetadata);

    // Check if alternate or embed links are available
    if (fileMetadata.alternateLink) {
      console.log('Alternate Link:', fileMetadata.alternateLink);
    } else {
      console.log('No Alternate Link available.');
    }

    if (fileMetadata.embedLink) {
      console.log('Embed Link:', fileMetadata.embedLink);
    } else {
      console.log('No Embed Link available.');
    }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

getFileMetadata();