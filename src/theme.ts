import { createTheme } from '@mui/material/styles';

// Cyanide palette converted from oklch to hex (approximate)
const cyanideTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7ff0e5', // oklch(89% 0.196 126.665)
      contrastText: '#000000', // oklch(0% 0 0)
    },
    secondary: {
      main: '#e07fff', // oklch(71% 0.203 305.504)
      contrastText: '#fff0f5', // oklch(94% 0.028 342.258)
    },
    background: {
      default: '#231f2e', // oklch(27% 0.006 286.033)
      paper: '#1a191c', // oklch(20% 0 0)
    },
    text: {
      primary: '#ffffff', // oklch(100% 0 0)
      secondary: '#bdbdbd', // fallback for secondary text
    },
    success: {
      main: '#5aff8d', // oklch(79% 0.209 151.711)
      contrastText: '#000000', // oklch(0% 0 0)
    },
    info: {
      main: '#6ecbff', // oklch(74% 0.16 232.661)
      contrastText: '#2a3a4a', // oklch(29% 0.066 243.157)
    },
    warning: {
      main: '#ffe97a', // oklch(82% 0.189 84.429)
      contrastText: '#a68a4a', // oklch(41% 0.112 45.904)
    },
    error: {
      main: '#ff7a7a', // oklch(71% 0.194 13.428)
      contrastText: '#000000', // oklch(0% 0 0)
    },
    divider: '#3a3a4a', // fallback for divider
  },
  shape: {
    borderRadius: 16, // similar to --radius-box
  },
});

export default cyanideTheme;
