import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    console.log('Firebase initialized via service account JSON env variable.');
    db = admin.firestore();
    auth = admin.auth();
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
    });
    console.log('Firebase initialized via credentials env variables.');
    db = admin.firestore();
    auth = admin.auth();
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.USE_FIREBASE_DEFAULT) {
    admin.initializeApp();
    console.log('Firebase initialized via default credentials.');
    db = admin.firestore();
    auth = admin.auth();
  } else {
    // Skip to catch block to force mock database
    throw new Error('No Firebase credentials provided. Switching to mock db.');
  }
} catch (error: any) {
  console.warn('Firebase admin initialization bypassed/failed:', error.message);
  console.warn('Running in development sandbox mode with local firestore-mock.');
  // We will export a mock database if Firebase fails, so the app runs out-of-the-box!
  const mockDb = require('./firestore-mock').mockDb;
  db = mockDb as any;
  auth = {
    verifyIdToken: async (token: string) => {
      if (token === 'mock-super-admin-token') {
        return { uid: 'super-admin-id', role: 'super-admin', email: 'admin@autobiz.ai' };
      }
      if (token.startsWith('mock-biz-')) {
        const businessId = token.split('-')[2];
        return { uid: `owner-${businessId}`, role: 'business-admin', businessId, email: `owner@${businessId}.com` };
      }
      return { uid: 'mock-user-id', role: 'employee', email: 'staff@autobiz.ai' };
    }
  } as any;
}

export { db, auth };
export const storage = admin.apps.length > 0 && admin.storage() ? admin.storage() : null;
