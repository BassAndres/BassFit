/**
 * Custom (user-created) exercises.
 * Path: `users/{uid}/exercises/{exerciseId}`.
 *
 * The shared seed catalog lives in `data/exerciseCatalog`; these are merged
 * with the user's custom movements by `useExerciseCatalog`.
 */
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Exercise } from '@/types/models';

function exercisesCol(uid: string) {
  return collection(db, 'users', uid, 'exercises');
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function listCustomExercises(uid: string): Promise<Exercise[]> {
  const snap = await getDocs(exercisesCol(uid));
  return snap.docs.map((d) => ({ ...(d.data() as Exercise), isCustom: true }));
}

export async function addCustomExercise(uid: string, exercise: Exercise): Promise<void> {
  await setDoc(
    doc(exercisesCol(uid), exercise.id),
    clean({ ...exercise, isCustom: true } as unknown as Record<string, unknown>)
  );
}

export async function deleteCustomExercise(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(exercisesCol(uid), id));
}
