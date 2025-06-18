// src/config/firebase.js
require('dotenv').config();
const admin = require('firebase-admin');
const path  = require('path');

// build an absolute path to the JSON credentials:
const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_CREDENTIALS_PATH);
const serviceAccount     = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin.auth();
