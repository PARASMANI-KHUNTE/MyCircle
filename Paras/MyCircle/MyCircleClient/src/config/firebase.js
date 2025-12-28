import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBGl3hiphdrmsvKVR__-SS5rIpskRNgHVk",
    authDomain: "mycircle-8c36a.firebaseapp.com",
    projectId: "mycircle-8c36a",
    storageBucket: "mycircle-8c36a.firebasestorage.app",
    messagingSenderId: "831452174420",
    appId: "1:831452174420:web:967742754fc87b338e75c1",
    measurementId: "G-40CYBYXEB8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
