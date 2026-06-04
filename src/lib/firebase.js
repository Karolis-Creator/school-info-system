// src/lib/firebase.js
// ============================================================
// REPLACE these values with your actual Firebase project config
// Go to: Firebase Console → Project Settings → Your Apps → Web App
// ============================================================
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA3-AIkbeA-0D-oeWlhRkeSW3e7iX6Z-qU",
  authDomain: "school-guide-d27bd.firebaseapp.com",
  projectId: "school-guide-d27bd",
  storageBucket: "school-guide-d27bd.firebasestorage.app",
  messagingSenderId: "531283643411",
  appId: "1:531283643411:web:08f6080deb6231661c03e6",
  measurementId: "G-70YKVS2537"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
