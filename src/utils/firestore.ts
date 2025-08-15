// Utility type guard for Firestore Timestamp objects
// Usage: import { isFirestoreTimestamp } from './firestore';

export function isFirestoreTimestamp(
  obj: unknown
): obj is { seconds: number; nanoseconds: number } {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'seconds' in obj &&
    typeof (obj as Record<string, unknown>).seconds === 'number' &&
    'nanoseconds' in obj &&
    typeof (obj as Record<string, unknown>).nanoseconds === 'number'
  );
}
