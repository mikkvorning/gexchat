import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDXEfI0fRxbZX6fcaiWUhnR3CXrYCqPF_c',
  authDomain: 'gexchat.firebaseapp.com',
  projectId: 'gexchat',
  storageBucket: 'gexchat.firebasestorage.app',
  messagingSenderId: '624887959541',
  appId: '1:624887959541:web:e46ecf90ea24dfdcaa5abc',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
