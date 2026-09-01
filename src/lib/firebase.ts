import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0151543125",
  appId: "1:388316014742:web:ccdc92ff54eb27a7d97ab7",
  apiKey: "AIzaSyDQjeKyctkE66s1fBDJlZ02jmiERWQs4Fw",
  authDomain: "gen-lang-client-0151543125.firebaseapp.com",
  storageBucket: "gen-lang-client-0151543125.firebasestorage.app",
  messagingSenderId: "388316014742",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-053c26a6-5b5a-445c-a460-3806da22a2e9");
export const auth = getAuth(app);
