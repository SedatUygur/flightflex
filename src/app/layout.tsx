"use client";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
/*import { Provider } from 'react-redux';
import store from '../redux/store';*/
import { CssBaseline } from '@mui/material';
import { MuiProvider } from "../providers/MUIProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

{/* <Provider store={store}>
        <CssBaseline />
        <main>{children}</main>
    </Provider> */}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MuiProvider>
          <CssBaseline />
          <main>{children}</main>
        </MuiProvider>
      </body>
    </html>
  );
}
