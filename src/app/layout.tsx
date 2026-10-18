import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
