import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCP_5NjPM2Glbidu_D0I1lGQXgZr_I2bmw',
  authDomain: 'chiya-5f9a3.firebaseapp.com',
  projectId: 'chiya-5f9a3',
  storageBucket: 'chiya-5f9a3.firebasestorage.app',
  messagingSenderId: '312990756752',
  appId: '1:312990756752:web:421189a4e5e2ed7e248d15',
  measurementId: 'G-NY66ELPYJX',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Optional analytics; only init when supported (avoids SSR issues)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export { serverTimestamp, Timestamp };

