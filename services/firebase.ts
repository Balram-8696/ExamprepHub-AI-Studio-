
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = { 
    apiKey: "AIzaSyC3LR1VwIj8S_5iv3BjB_bPZtbGHFvRWhc", 
    authDomain: "test-ee5ae.firebaseapp.com", 
    projectId: "test-ee5ae", 
    storageBucket: "test-ee5ae.appspot.com", 
    messagingSenderId: "266414136259", 
    appId: "1:266414136259:web:fe1f82d7a29e19d35d7b76" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
