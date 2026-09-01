import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0151543125",
  appId: "1:388316014742:web:ccdc92ff54eb27a7d97ab7",
  apiKey: "AIzaSyDQjeKyctkE66s1fBDJlZ02jmiERWQs4Fw",
  authDomain: "gen-lang-client-0151543125.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  try {
    await createUserWithEmailAndPassword(auth, "test-ai-studio@example.com", "password123");
    console.log("Create user SUCCESS");
  } catch(e) {
    console.error("Create user FAIL:", e.message);
  }
}
test();
