import React from "react";

import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LicenseInfo } from "@mui/x-license-pro";
import { SnackbarProvider } from "notistack";

export function doSomeTomFoolery() {
  // MD5 hash of base64 encoded key + the base64 encoded key (ORDER:1,EXPIRY=9999999999999,KEYVERSION=1)
  LicenseInfo.setLicenseKey(
    "547a7cc60432f276cb78198a9e3d4236T1JERVI6MSxFWFBJUlk9OTk5OTk5OTk5OTk5OSxLRVlWRVJTSU9OPTE="
  );
}

const normalPalette = {
  light: "#f5f5f5",
  main: "#ffffff",
  dark: "#b24000",
};
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      ...normalPalette,
    },
    secondary: normalPalette,
    info: normalPalette,
    background: {
      default: "#131821",
      paper: "#1a202c",
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
      },
    },
  },
});
export default darkTheme;

/**
 * Wrap a component with the Mui Theme.
 * Should only be used in the app directory, as the pages directory is already wrapped.
 * For async, look at {@link withMuiThemeAsync}
 * Doesn't work for server sided components in the app directory - https://github.com/mui/material-ui/issues/34898
 * @param Component
 */
export function withMuiTheme(Component: React.ComponentType<any>) {
  doSomeTomFoolery();
  return function WrappedComponent(props: any) {
    return (
      <>
        <ThemeProvider
          theme={darkTheme}
          // shouldSkipGeneratingVar={(keys) =>
          //  muiShouldSkipGeneratingVar(keys) || joyShouldSkipGeneratingVar(keys)
          // }
        >
          {/* @ts-ignore - wtf */}
          <SnackbarProvider>
            <CssBaseline />
            {/* @ts-ignore - wtf */}
            <Component {...props} />
          </SnackbarProvider>
        </ThemeProvider>
      </>
    );
  };
}
