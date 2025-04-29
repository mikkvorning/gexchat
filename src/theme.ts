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
        colorPrimary: {
          backgroundColor: '#aaf07f', // use primary color
          color: '#000',
        },
      },
      defaultProps: {
        color: 'primary',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          paddingRight: theme.spacing(2),
          paddingLeft: theme.spacing(2),
          whiteSpace: 'normal',
          minWidth: 'unset',
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardInfo: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.info.main,
        }),
        standardSuccess: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.success.main,
        }),
        standardWarning: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.warning.main,
        }),
        standardError: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.error.main,
        }),
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
});

export default cyanideTheme;
