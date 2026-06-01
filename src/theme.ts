import { createTheme } from '@mui/material/styles';

export function createAppTheme(dark: boolean, accent = '#4664c9') {
  return createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary: { main: accent },
      background: {
        default: dark ? 'oklch(0.18 0.008 260)' : 'oklch(0.975 0.003 250)',
        paper: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)',
      },
      divider: dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)',
      text: {
        primary: dark ? 'oklch(0.95 0.005 260)' : 'oklch(0.23 0.012 260)',
        secondary: dark ? 'oklch(0.74 0.008 260)' : 'oklch(0.46 0.01 260)',
        disabled: dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)',
      },
    },
    typography: {
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: 14,
      h1: { fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
      h2: { fontSize: 16, fontWeight: 600 },
      h3: { fontSize: 14, fontWeight: 600 },
      body2: { fontSize: 13 },
    },
    shape: { borderRadius: 9 },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '-0.005em',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16, backgroundImage: 'none' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 9,
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 13.5,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 13,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: { borderRadius: 12, backgroundImage: 'none' },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontFamily: '"IBM Plex Sans", system-ui, sans-serif' },
        },
      },
      MuiCssBaseline: {
        styleOverrides: `
          * { box-sizing: border-box; }
          html, body, #root { height: 100%; margin: 0; }
          body {
            font-family: "IBM Plex Sans", system-ui, sans-serif;
            -webkit-font-smoothing: antialiased;
            font-size: 14px;
            letter-spacing: -0.005em;
          }
        `,
      },
    },
  });
}
