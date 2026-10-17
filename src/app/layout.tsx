import type { Metadata } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WaraNusa — Jelajahi Warisan Budaya Indonesia",
  description:
    "Platform digital interaktif untuk menjelajahi warisan budaya Indonesia: peta interaktif, rumah adat & alat musik dalam 3D, arsip budaya, dan kontribusi komunitas.",
  keywords: [
    "budaya Indonesia",
    "rumah adat",
    "alat musik tradisional",
    "peta interaktif",
    "warisan budaya",
    "WaraNusa",
  ],
  authors: [{ name: "WaraNusa" }],
  openGraph: {
    title: "WaraNusa — Jelajahi Warisan Budaya Indonesia",
    description:
      "Peta interaktif, visualisasi 3D rumah adat & alat musik, arsip budaya, dan kontribusi komunitas.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${fraunces.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
