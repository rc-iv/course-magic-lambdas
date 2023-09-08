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

const drive = google.drive({ version: 'v3', auth });

async function listFiles() {
  try {
    const res = await drive.files.list({
      pageSize: 10,
      fields: 'files(id, name)',
    });
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  } catch (err) {
    console.error('The API returned an error:', err);
  }
}

listFiles();
