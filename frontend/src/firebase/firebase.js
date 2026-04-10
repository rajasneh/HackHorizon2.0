// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBn6-JvknPkh61mR2Prnkfih2va_NLK31I",
    authDomain: "tktplz-4817c.firebaseapp.com",
    projectId: "tktplz-4817c",
    storageBucket: "tktplz-4817c.firebasestorage.app",
    messagingSenderId: "502731927599",
    appId: "1:502731927599:web:1b9d0f1cc43aefa5f9d6da",
    measurementId: "G-KF0T7M5CHL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();