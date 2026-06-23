/**
 * Firebase initialization.
 *
 * Fill the config below with your project's values (Firebase console →
 * Project settings → "Your apps"). For React Native, Auth must be initialized
 * with AsyncStorage persistence so sessions survive app restarts.
 *
 * Firestore data model (NoSQL, denormalized for read-cheap mobile access):
 *
 *   exercises/{exerciseId}                  → global Exercise catalog (shared)
 *   users/{uid}                             → profile doc
 *   users/{uid}/routines/{routineId}        → Routine templates
 *   users/{uid}/workouts/{workoutId}        → Workout sessions (history)
 *
 * Sets, 1RM, RIR and RPE live *inside* each Workout document as nested
 * arrays (WorkoutExercise[] → SetLog[]) rather than in their own collection.
 * A training session is read and written as one unit, so embedding avoids N
 * extra reads per session and keeps history queries to a single fetch. The
 * exercise catalog stays a top-level collection because it is shared across
 * all users and referenced by id, never duplicated.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, type Persistence } from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * `firebase/auth`'s default type entry doesn't expose `getReactNativePersistence`
 * — it lives in the React Native build that Metro resolves at runtime, so the
 * type declarations (which point at the browser build) omit it. Re-bind it
 * through the namespace import with its real signature to satisfy `tsc` while
 * keeping the runtime call correct.
 */
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
