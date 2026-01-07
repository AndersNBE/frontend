import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import TopNav from "./components/TopNav";

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
        <TopNav />
        <div className="pageShell">{children}</div>
      </body>
    </html>
  );
}
