import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(__dirname, '..', 'serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else {
    // Fallback: use application default credentials (for deployed environments)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log('⚠️  Firebase Admin initialized without service account (limited functionality)');
  }
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
