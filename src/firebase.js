// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBdDiKqLaGlHVqAse2AW30YlHFM90MN9Vg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "hotel-costa-23fb0.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "hotel-costa-23fb0",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "hotel-costa-23fb0.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "545492956651",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:545492956651:web:00cff02ff2c798c0b095ae",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-CVBBT8RGLC"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app; 