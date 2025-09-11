'use client';

import { Button, Alert } from '@/app/muiImports';
import { useLogout } from '@/hooks/useLogout';
import { getErrorMessage } from '@/utils/errorMessages';

interface LogoutButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  fullWidth?: boolean;
  showError?: boolean;
}

export const LogoutButton = ({
  variant = 'outlined',
  fullWidth = false,
  showError = false,
}: LogoutButtonProps) => {
  const { mutate: logout, isPending, error } = useLogout();

  return (
    <>
      <Button
        variant={variant}
        fullWidth={fullWidth}
        onClick={() => logout()}
        disabled={isPending}
      >
        {isPending ? 'Signing out...' : 'Log Out'}
      </Button>

      {showError && error && (
        <Alert severity='error' sx={{ mt: 1 }}>
          {getErrorMessage(error)}
        </Alert>
      )}
    </>
  );
};
