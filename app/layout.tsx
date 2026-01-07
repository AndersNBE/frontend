import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "./components/TopNav";

const geistSans = Geist({
  variable: "--fontGeistSans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--fontGeistMono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foresee",
  description: "Prediction markets",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TopNav />
        <div className="pageShell">{children}</div>
      </body>
    </html>
  );
}
