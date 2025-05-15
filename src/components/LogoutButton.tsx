'use client';

import { Button } from '@/app/muiImports';
import { useLogout } from '@/hooks/useLogout';

interface LogoutButtonProps {
  variant?: 'text' | 'outlined' | 'contained';
  fullWidth?: boolean;
}

export const LogoutButton = ({
  variant = 'outlined',
  fullWidth = false,
}: LogoutButtonProps) => {
  const { logout } = useLogout();

  return (
    <Button variant={variant} fullWidth={fullWidth} onClick={logout}>
      Log Out
    </Button>
  );
};
