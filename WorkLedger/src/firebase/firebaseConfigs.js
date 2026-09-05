// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD9kQ37g8cB_HVeoq9DNajC-DX9JeUlxk0",
  authDomain: "worker-attendance-c45e7.firebaseapp.com",
  projectId: "worker-attendance-c45e7",
  storageBucket: "worker-attendance-c45e7.firebasestorage.app",
  messagingSenderId: "673454234251",
  appId: "1:673454234251:web:68ac895978256d9cead28e",
  measurementId: "G-87RJ6VH68J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);