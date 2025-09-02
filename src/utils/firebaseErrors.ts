// Helper function to convert Firebase error codes to user-friendly messages
export const getFirebaseErrorMessage = (errorMessage: string): string => {
  // Extract Firebase error code from messages like "Firebase: Error (auth/invalid-credential)."
  const firebaseCodeMatch = errorMessage.match(/auth\/[\w-]+/);
  const errorCode = firebaseCodeMatch ? firebaseCodeMatch[0] : errorMessage;

  // prettier-ignore
  const errorMessages: Record<string, string> = {
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
	};

  return (
    errorMessages[errorCode] ?? errorMessage // Return original message if no mapping found
  );
};
