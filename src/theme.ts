import { createTheme } from '@mui/material/styles';

const cyanideTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#aaf07f',
      contrastText: '#000000',
    },
    secondary: {
      main: '#aaf07f',
      contrastText: '#000000',
    },
    background: {
      paper: '#292929',
      default: '#181818',
    },
    text: {
      primary: '#ffffff',
      secondary: '#bdbdbd',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#00ffe3',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorInherit: {
          backgroundColor: '#191331',
          color: '#fff',
        },
      },
      defaultProps: {
        color: 'inherit',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          px: theme.spacing(2),
          whiteSpace: 'normal',
          minWidth: 'unset',
        }),
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
});

export default cyanideTheme;
