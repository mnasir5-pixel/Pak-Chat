
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const rawConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "PLACEHOLDER",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "PLACEHOLDER",
  projectId: process.env.FIREBASE_PROJECT_ID || "PLACEHOLDER",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "PLACEHOLDER",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "PLACEHOLDER",
  appId: process.env.FIREBASE_APP_ID || "PLACEHOLDER"
};

// Sanitize: Trim whitespace/newlines that often come from copy-pasting
const firebaseConfig = Object.fromEntries(
  Object.entries(rawConfig).map(([key, value]) => [key, value?.trim()])
);

// Diagnostic Check: Print masked config to verify injection in the builder environment
// Fix: Removed problematic vite/client type reference that caused build errors.
// Using safe check for environment and casting import.meta for compatibility.
const isEnvAvailable = typeof import.meta !== 'undefined' && !!(import.meta as any).env;
const isDev = isEnvAvailable && (import.meta as any).env.DEV;

if (isDev || true) {
  const isPlaceholder = firebaseConfig.apiKey === "PLACEHOLDER";
  console.group("🚀 Firebase Configuration Diagnostic");
  console.info("Project ID:", firebaseConfig.projectId);
  console.info("API Key Status:", isPlaceholder ? "❌ MISSING (Using Placeholder)" : "✅ DETECTED");
  if (!isPlaceholder) {
    const key = firebaseConfig.apiKey;
    console.info("Key Preview:", `${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
  }
  console.groupEnd();
}

// Re-initialization safety for hot-reloads
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
