/**
 * Persistence for completed workout sessions.
 * Path: `users/{uid}/workouts/{workoutId}`.
 *
 * Stores the Workout document as-is (sets embedded). Epoch-millis timestamps
 * are persisted as plain numbers, so no Timestamp conversion is needed.
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Workout } from '@/types/models';

function workoutsCol(uid: string) {
  return collection(db, 'users', uid, 'workouts');
}

/** Strip `undefined` fields — Firestore rejects them. */
function clean<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const ref = doc(workoutsCol(workout.ownerUid), workout.id);
  await setDoc(ref, clean(workout as unknown as Record<string, unknown>));
}

export async function getWorkout(uid: string, id: string): Promise<Workout | null> {
  const snap = await getDoc(doc(workoutsCol(uid), id));
  return snap.exists() ? (snap.data() as Workout) : null;
}

export async function listWorkouts(uid: string, max = 50): Promise<Workout[]> {
  const q = query(workoutsCol(uid), orderBy('startedAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Workout);
}

export async function deleteWorkout(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(workoutsCol(uid), id));
}
