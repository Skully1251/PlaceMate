import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD6rG6z_IWlEqn7FmT1y8L1VB_YwXnf2sI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "quantix-59574.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "quantix-59574",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "quantix-59574.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1098061150583",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1098061150583:web:938d601d202038ccd9c972",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-GXJWW9PYQY",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
};

export default app;
