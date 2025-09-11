import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../../public/assets/css/bootstrap.min.css";
import "../../public/assets/css/plugins.css";
import "../../public/assets/css/style.css";

import { CartProvider } from "../components/header/CartContext";
import { WishlistProvider } from "../components/header/WishlistContext";
import { CompareProvider } from "../components/header/CompareContext";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Genkimart-Grocery-Store(e-Commerce)",
  description: "One stop for Grcoery shopping",
  icons: {
    icon: [
      {
        url: "/assets/images/fav.png",
        type: "image/x-icon",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* <CompareProvider> */}
          <WishlistProvider>
            <CartProvider>
              {children}
              <ToastContainer position="top-right" autoClose={3000} />
            </CartProvider>
          </WishlistProvider>
        {/* </CompareProvider> */}
      </body>
    </html>
  );
}
