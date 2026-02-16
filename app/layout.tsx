import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import "./globals.css";
import TopNavServer from "./components/TopNavServer";
import SiteFooter from "./components/SiteFooter";

const satoshi = localFont({
  src: [
    {
      path: "./fonts/Satoshi-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foresee",
  description: "Prediction markets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} antialiased`}>
        <Suspense fallback={null}>
          <TopNavServer />
        </Suspense>

        <div className="pageShell">{children}</div>

        <SiteFooter />
      </body>
    </html>
  );
}
