import React from "react";

import { CacheProvider, EmotionCache } from "@emotion/react";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { SnackbarProvider } from "notistack";

import Stars from "@components/Stars";
import Cursor from "@components/templates/Cursor";
import createEmotionCache from "@util/createEmotionCache";
import { EasterEgg } from "@util/EasterEgg";
import darkTheme, { doSomeTomFoolery } from "@util/MuiTheme";
import ReRenderHelper from "@util/ReRenderHelper";
import { CartProvider, useCart } from "react-use-cart";

import "../styles/global.css";
import NextTransitionBar from "next-transition-bar";

const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export const SearchContext = React.createContext({
  setSearch: (sr: string) => null,
  search: "",
});

export const CartContext = React.createContext({
  menu: false,
  setMenu: (b: boolean) => null,
});
// TS thinks that the session prop is not defined, but it is.
// @ts-ignore
const App = (props: MyAppProps) => {
  const {
    Component,
    emotionCache = clientSideEmotionCache,
    pageProps: { session, ...pageProps },
  } = props;
  const [search, setSearch] = React.useState("");
  const [menu, setMenu] = React.useState<boolean>();

  doSomeTomFoolery();
  return (
    <>
      {/* @ts-ignore */}
      <CartContext.Provider value={{ menu, setMenu }}>
        {/* @ts-ignore */}
        <SearchContext.Provider value={{ search, setSearch }}>
          <CacheProvider value={emotionCache}>
            <SessionProvider session={session}>
              <ThemeProvider theme={darkTheme}>
                <CartProvider>
                  <ReRenderHelper>
                    <LocalizationProvider
                      dateAdapter={AdapterMoment}
                      adapterLocale={"en-US"}
                    >
                      {/* @ts-ignore */}
                      <SnackbarProvider>
                        {/* <NextTransitionBar
                          color="#29d"
                          initialPosition={0.08}
                          trickleSpeed={200}
                          height={4}
                          trickle={true}
                          showSpinner={false}
                          easing="ease"
                          speed={200}
                          shadow="0 0 10px #29d, 0 0 5px #29d"
                          template='<div class="bar" role="bar"><div class="peg"></div></div>
            <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
                          zIndex={1600}
                          showAtBottom={false}
                          isRTL={false}
                          nonce={undefined}
                          transformCSS={(css) => (
                            <style nonce={undefined}>{css}</style>
                          )}
                        /> */}
                        {/*<Cursor />*/}
                        <Stars />
                        <EasterEgg />
                        {/* @ts-ignore */}
                        <Component {...pageProps} />
                      </SnackbarProvider>
                    </LocalizationProvider>
                  </ReRenderHelper>
                </CartProvider>
              </ThemeProvider>
            </SessionProvider>
          </CacheProvider>
        </SearchContext.Provider>
      </CartContext.Provider>
    </>
  );
};

export default App;
