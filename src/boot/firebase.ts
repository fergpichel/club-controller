import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { logger } from 'src/utils/logger'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1');

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  logger.log(
    '%c🔧 FIREBASE EMULATORS %c\n' +
    'Connected to local emulators.\n' +
    'Auth: http://localhost:9099\n' +
    'Firestore: http://localhost:8080\n' +
    'Storage: http://localhost:9199\n' +
    'Functions: http://localhost:5001\n' +
    'UI: http://localhost:4000',
    'background: #FF9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    ''
  );
}

export { app, db, auth, storage, functions };

export default boot(({ app: vueApp }) => {
  // Make firebase available globally if needed
  vueApp.config.globalProperties.$firebase = {
    app,
    db,
    auth,
    storage,
    functions
  };
});
