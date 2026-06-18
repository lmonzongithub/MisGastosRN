import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDWUaOX6ZaZRm6nfOQp-vyT_WYjNNWCuYI",
  authDomain: "misgastos-aa284.firebaseapp.com",
  projectId: "misgastos-aa284",
  storageBucket: "misgastos-aa284.firebasestorage.app",
  messagingSenderId: "686154964199",
  appId: "1:686154964199:web:533d0dd907caee50605642"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;