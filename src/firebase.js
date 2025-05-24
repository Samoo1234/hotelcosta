// Configuração do Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdDiKqLaGlHVqAse2AW30YlHFM90MN9Vg",
  authDomain: "hotel-costa-23fb0.firebaseapp.com",
  projectId: "hotel-costa-23fb0",
  storageBucket: "hotel-costa-23fb0.firebasestorage.app",
  messagingSenderId: "545492956651",
  appId: "1:545492956651:web:00cff02ff2c798c0b095ae",
  measurementId: "G-CVBBT8RGLC"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

export default app; 