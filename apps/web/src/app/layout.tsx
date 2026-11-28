import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "FirstReach", template: "%s · FirstReach" },
  description: "Know who loses power when the flood hits, and who to reach first.",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={inter.variable}>
    <body>{children}</body>
  </html>
);

export default RootLayout;
