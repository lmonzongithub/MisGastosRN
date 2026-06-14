// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWUaOX6ZaZRm6nfOQp-vyT_WYjNNWCuYI",
  authDomain: "misgastos-aa284.firebaseapp.com",
  projectId: "misgastos-aa284",
  storageBucket: "misgastos-aa284.firebasestorage.app",
  messagingSenderId: "686154964199",
  appId: "1:686154964199:web:533d0dd907caee50605642"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export default app;