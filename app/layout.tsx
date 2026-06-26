import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IntroAnimation } from "@/components/ui/intro-animation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WorkSupply Hours",
  description: "Daily hours logging and confirmation for WorkSupply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IntroAnimation />
        {children}
      </body>
    </html>
  );
}
