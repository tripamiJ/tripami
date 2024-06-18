import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';
import { FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import { getFunctions } from '@firebase/functions';
import { getStorage } from '@firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCwDkMaHWXRpO7hY6z62_Gu8eLxMMItjT8',
  authDomain: 'tripami-3e954.firebaseapp.com',
  projectId: 'tripami-3e954',
  storageBucket: 'tripami-3e954.appspot.com',
  messagingSenderId: '28031075047',
  appId: '1:28031075047:web:10f8bdcfc7135945eb1842',
  measurementId: 'G-FLKNXLKRP7',
};

export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions();

export const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('user_birthday');

export const googleProvider = new GoogleAuthProvider();
