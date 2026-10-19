import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { CulturalChatWidget } from "@/components/chat/cultural-chat-widget";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "WaraNusa — Platform Eksplorasi & Pelestarian Budaya Indonesia",
    template: "%s · WaraNusa",
  },
  description:
    "WaraNusa adalah platform digital untuk eksplorasi, pembelajaran, dokumentasi, dan pelestarian warisan budaya Indonesia melalui peta interaktif, katalog budaya bersumber, visualisasi 3D, dan instrumen musik virtual.",
  keywords: ["budaya Indonesia", "rumah adat", "batik", "gamelan", "warisan budaya", "museum digital"],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "WaraNusa — Kenali Akar, Jelajahi Budaya",
    description: "Platform eksplorasi & pelestarian budaya Indonesia dengan peta interaktif, katalog bersumber, 3D, dan instrumen virtual.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${geistMono.variable} antialiased bg-background text-foreground font-sans`}>
        {children}
        <Toaster />
        <SonnerToaster position="top-center" richColors closeButton />
        <CulturalChatWidget />
      </body>
    </html>
  );
}
