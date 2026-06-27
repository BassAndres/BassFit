/**
 * Persistence for routine templates.
 * Path: `users/{uid}/routines/{routineId}`.
 */
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Routine } from '@/types/models';

function routinesCol(uid: string) {
  return collection(db, 'users', uid, 'routines');
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function upsertRoutine(routine: Routine): Promise<void> {
  const ref = doc(routinesCol(routine.ownerUid), routine.id);
  await setDoc(ref, clean(routine as unknown as Record<string, unknown>));
}

export async function listRoutines(uid: string): Promise<Routine[]> {
  const q = query(routinesCol(uid), orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Routine);
}

export async function deleteRoutine(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(routinesCol(uid), id));
}
