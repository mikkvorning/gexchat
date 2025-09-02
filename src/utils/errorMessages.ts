import { FirebaseError } from 'firebase/app';

// Helper function to convert Firebase error codes to user-friendly messages
export const getFirebaseErrorMessage = (error: FirebaseError | Error | unknown): string => {
	// Extract error code - Firebase errors have a 'code' property
	const code = (error as FirebaseError)?.code || 'unknown-error';

	// prettier-ignore
	const errorMessages: Record<string, string> = {
		// Auth errors
		'auth/user-not-found': 'No account found with this email address. Please check your email or sign up.',
		'auth/wrong-password': 'Incorrect password. Please try again.',
		'auth/invalid-email': 'Please enter a valid email address.',
		'auth/user-disabled': 'This account has been disabled. Please contact support.',
		'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
		'auth/operation-not-allowed': 'Email/password sign-in is currently disabled. Please contact support.',
		'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
		'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
		'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
		'auth/popup-closed-by-user': 'Sign-in was cancelled. Please try again.',
		'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
		'auth/requires-recent-login': 'This action requires recent authentication. Please log in again.',
		
		// Firestore errors
		'firestore/permission-denied': 'You do not have permission to access this data.',
		'firestore/unavailable': 'The service is currently unavailable. Please try again later.',
		'firestore/deadline-exceeded': 'The operation took too long. Please try again.',
	};

	return errorMessages[code] ?? 'Something went wrong. Please try again.';
};
