/**
 * Manages the email verification flow for user signup and authentication.
 * Handles sending verification emails, tracking verification status,
 * and managing resend attempts.
 * 
 * @module hooks/useEmailVerification
 */

import { useState } from 'react';
import { User, sendEmailVerification } from 'firebase/auth';
import { saveVerificationEmail, clearVerificationEmail } from '@/utils/storage';

/**
 * Return type for useEmailVerification hook
 */
interface UseEmailVerificationReturn {
  emailVerificationSent: boolean;
  verificationEmail: string;
  isResending: boolean;
  hasResentEmail: boolean;
  sendVerificationEmail: (user: User) => Promise<void>;
  resendVerificationEmail: (user: User) => Promise<void>;
  clearVerification: () => void;
}

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [hasResentEmail, setHasResentEmail] = useState(false);

  const sendVerificationEmail = async (user: User) => {
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      setEmailVerificationSent(true);
      setVerificationEmail(user.email || '');
      saveVerificationEmail(user.email || '');
    } catch {
      throw new Error('Failed to send verification email');
    }
  };

  const resendVerificationEmail = async (user: User) => {
    if (!user.email) return;

    setIsResending(true);
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: true,
      });
      setHasResentEmail(true);
    } finally {
      setIsResending(false);
    }
  };

  const clearVerification = () => {
    setEmailVerificationSent(false);
    setVerificationEmail('');
    setHasResentEmail(false);
    clearVerificationEmail();
  };

  return {
    emailVerificationSent,
    verificationEmail,
    isResending,
    hasResentEmail,
    sendVerificationEmail,
    resendVerificationEmail,
    clearVerification,
  };
};
