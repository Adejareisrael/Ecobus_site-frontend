import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/**
 * Google blocks its OAuth popup/redirect flow inside embedded WebViews (the
 * exact environment Capacitor apps run in), so on native platforms this goes
 * through the native Google Sign-In SDK instead — the web-based signInWithPopup
 * path is only used in an actual browser. Either way the caller gets back a
 * real Firebase ID token, verified the same way on the server either path.
 */
export async function signInWithGoogle(): Promise<{ idToken: string }> {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signInWithGoogle();
    const { token } = await FirebaseAuthentication.getIdToken();
    return { idToken: token };
  }

  const auth = getAuth(getFirebaseApp());
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  return { idToken };
}
