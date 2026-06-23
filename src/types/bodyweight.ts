/** A bodyweight measurement. Path: `users/{uid}/bodyweight/{entryId}`. */
export interface BodyweightEntry {
  id: string;
  /** Always stored in kilograms. */
  weightKg: number;
  /** Epoch millis when recorded. */
  recordedAt: number;
  note?: string;
}
