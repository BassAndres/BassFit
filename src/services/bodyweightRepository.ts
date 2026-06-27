/** Persistence for bodyweight tracking. Path: `users/{uid}/bodyweight/{id}`. */
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
import type { BodyweightEntry } from '@/types/bodyweight';

function col(uid: string) {
  return collection(db, 'users', uid, 'bodyweight');
}

function clean<T extends Record<string, unknown>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export async function addBodyweight(uid: string, entry: BodyweightEntry): Promise<void> {
  await setDoc(doc(col(uid), entry.id), clean(entry as unknown as Record<string, unknown>));
}

export async function listBodyweight(uid: string): Promise<BodyweightEntry[]> {
  const q = query(col(uid), orderBy('recordedAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as BodyweightEntry);
}

export async function deleteBodyweight(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(col(uid), id));
}
