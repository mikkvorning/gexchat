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
      paper: '#191919',
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
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& input[type="search"]::-webkit-search-cancel-button': {
            WebkitAppearance: 'none',
            height: 16,
            width: 16,
            background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23aaf07f'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z'/%3E%3C/svg%3E") no-repeat 50% 50%`,
            cursor: 'pointer',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 16,
  },
});

export default cyanideTheme;
