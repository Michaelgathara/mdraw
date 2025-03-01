import "@/styles/globals.css";

import React from "react";
import type { AppProps } from "next/app";
import Head from "next/head";

const App: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>MDraw</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
};

export default App;
