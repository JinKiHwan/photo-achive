import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function likesDatabase() {
  if (process.env.LIKES_ENABLED !== "true" || (process.env.LIKES_IP_SECRET?.length ?? 0) < 32) return null;
  const name = "photo-archive-likes";
  const existing = getApps().find(app => app.name === name);
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  const app = existing ?? initializeApp({
    projectId,
    ...(process.env.FIRESTORE_EMULATOR_HOST ? {} : {
      credential: serviceAccount ? cert(JSON.parse(serviceAccount)) : applicationDefault(),
    }),
  }, name);
  return getFirestore(app);
}
