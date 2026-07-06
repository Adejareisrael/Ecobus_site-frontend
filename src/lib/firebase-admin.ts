import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set"
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export type FirebaseIdentity = {
  uid: string;
  email: string;
  name: string | null;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseIdentity> {
  const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);

  if (!decoded.email) {
    throw new Error("Firebase account has no email address");
  }

  // Google always verifies email ownership, but this guards against future
  // providers (email/password, etc.) being added without that guarantee —
  // otherwise an unverified email could be used to link into an existing
  // account (including an admin one) that happens to share that address.
  if (!decoded.email_verified) {
    throw new Error("Firebase account email is not verified");
  }

  return {
    uid: decoded.uid,
    email: decoded.email.trim().toLowerCase(),
    name: typeof decoded.name === "string" ? decoded.name : null,
  };
}
