import { boot } from 'quasar/wrappers';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { logger } from 'src/utils/logger'

// Firebase configuration - Replace with your own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abc123'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
  logger.log(
    '%c🔧 FIREBASE EMULATORS %c\n' +
    'Connected to local emulators.\n' +
    'Auth: http://localhost:9099\n' +
    'Firestore: http://localhost:8080\n' +
    'Storage: http://localhost:9199\n' +
    'UI: http://localhost:4000',
    'background: #FF9800; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
    ''
  );
}

export { app, db, auth, storage };

export default boot(({ app: vueApp }) => {
  // Make firebase available globally if needed
  vueApp.config.globalProperties.$firebase = {
    app,
    db,
    auth,
    storage
  };
});
