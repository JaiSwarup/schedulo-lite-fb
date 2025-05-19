
import { initializeApp, getApps, getApp, FirebaseApp, FirebaseOptions } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseClientConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check for the API key, as its absence is the most common cause of "auth/invalid-api-key"
if (!firebaseClientConfig.apiKey) {
  const detailedErrorMessage = `
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
CRITICAL Firebase Configuration Error: API Key is Missing!
NEXT_PUBLIC_FIREBASE_API_KEY is undefined. Firebase cannot be initialized.

To resolve this:
1. Ensure a '.env.local' file exists in the root of your project.
   If not, create one.

2. Add all your Firebase project's client configuration variables to '.env.local':
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   You can find these values in your Firebase project settings:
   Project Overview -> Project settings (gear icon) -> General (scroll down to "Your apps").

3. If deploying your application, ensure these environment variables are set
   in your hosting provider's environment configuration.

The application will not function correctly until this is resolved.
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
`;
  console.error(detailedErrorMessage); // Log detailed message to server console
  // Throw a more generic error that will be visible in Next.js error overlay
  throw new Error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is not configured. " +
    "Check the server console for detailed instructions. The application cannot start."
  );
}

// Optionally, add warnings for other potentially missing essential keys
if (!firebaseClientConfig.projectId) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing. This might lead to issues with some Firebase services.");
}
if (!firebaseClientConfig.authDomain) {
    console.warn("Firebase Warning: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing. Authentication functionalities might be impaired.");
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if Firebase has already been initialized to prevent re-initialization
if (getApps().length === 0) {
  app = initializeApp(firebaseClientConfig);
} else {
  app = getApp(); // Use the existing app if already initialized
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
