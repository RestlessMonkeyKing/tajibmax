import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvaWRvpDY-BOOg_oitS4oVGDoQkiWMR6A",
  authDomain: "windowsassistant-36760.firebaseapp.com",
  projectId: "windowsassistant-36760",
  storageBucket: "windowsassistant-36760.firebasestorage.app",
  messagingSenderId: "125638102938",
  appId: "1:125638102938:web:42e36690e0b74096003423",
  databaseURL: "https://windowsassistant-36760-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;