import * as admin from 'firebase-admin';

export const Admin = admin.initializeApp();

export const DB = admin.firestore();
