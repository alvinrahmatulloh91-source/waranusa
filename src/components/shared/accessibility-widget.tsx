"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Accessibility,
  X,
  Type,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Square,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FontSizeOption = "normal" | "medium" | "large";

interface A11yPreferences {
  fontSize: FontSizeOption;
  highContrast: boolean;
}

const STORAGE_KEY = "waranusa_a11y_prefs";

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<FontSizeOption>("normal");
  const [highContrast, setHighContrast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Manipulasi Class & Style Root HTML
  const applyFontSize = (size: FontSizeOption) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("text-size-normal", "text-size-medium", "text-size-large");
    root.classList.add(`text-size-${size}`);

    if (size === "normal") root.style.fontSize = "100%";
    else if (size === "medium") root.style.fontSize = "110%";
    else if (size === "large") root.style.fontSize = "125%";
  };

  const applyHighContrast = (active: boolean) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (active) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
  };

  // Simpan setelan ke localStorage
  const savePreferences = (prefs: A11yPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Abaikan jika quota storage browser penuh
    }
  };

  // Muat setelan saat mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("speechSynthesis" in window)) {
      setSpeechSupported(false);
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<A11yPreferences>;
        if (parsed.fontSize) {
          setFontSize(parsed.fontSize);
          applyFontSize(parsed.fontSize);
        }
        if (typeof parsed.highContrast === "boolean") {
          setHighContrast(parsed.highContrast);
          applyHighContrast(parsed.highContrast);
        }
      }
    } catch {
      // Abaikan bila data korup
    }
  }, []);

  // Tutup popover saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Hentikan suara saat komponen unmount atau berpindah
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Update Ukuran Font
  const handleFontSizeChange = (size: FontSizeOption) => {
    setFontSize(size);
    applyFontSize(size);
    savePreferences({ fontSize: size, highContrast });
  };

  // Toggle Kontras Tinggi
  const handleToggleHighContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    applyHighContrast(next);
    savePreferences({ fontSize, highContrast: next });
  };

  // Ekstraksi teks artikel yang relevan dari halaman saat ini
  const extractReadableContent = (): string => {
    if (typeof document === "undefined") return "";

    const mainEl = document.querySelector("main") || document.querySelector("article");
    const container = mainEl || document.body;

    // Kloning node agar tidak merusak DOM asli
    const clone = container.cloneNode(true) as HTMLElement;

    // Bersihkan elemen yang tidak perlu dibacakan
    const ignoreElements = clone.querySelectorAll(
      "header, nav, footer, script, style, svg, button, [data-a11y-ignore], [aria-hidden='true']"
    );
    ignoreElements.forEach((el) => el.remove());

    const textNodes: string[] = [];
    const elements = clone.querySelectorAll("h1, h2, h3, h4, p, li");

    if (elements.length > 0) {
      elements.forEach((el) => {
        const t = el.textContent?.trim();
        if (t && t.length > 2) {
          textNodes.push(t);
        }
      });
      return textNodes.join(". ");
    }

    return clone.innerText?.trim() || "";
  };

  // Web Speech API Text-to-Speech (Bahasa Indonesia)
  const handleStartSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const textToRead = extractReadableContent();
    if (!textToRead) return;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "id-ID";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Cari suara Bahasa Indonesia bila tersedia di sistem
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(
      (v) =>
        v.lang.toLowerCase().includes("id") ||
        v.name.toLowerCase().includes("indonesia") ||
        v.lang === "id-ID"
    );
    if (idVoice) {
      utterance.voice = idVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // Reset Setelan Aksesibilitas
  const handleReset = () => {
    handleFontSizeChange("normal");
    setHighContrast(false);
    applyHighContrast(false);
    handleStopSpeech();

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  };

  return (
    <div data-a11y-ignore className="select-none">
      {/* ================= FLOATING TRIGGER BUTTON (Pojok Kiri Bawah) ================= */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-6 left-6 z-50",
          "group flex items-center justify-center",
          "w-14 h-14 rounded-full",
          "bg-stone-900/90 dark:bg-slate-950/90 backdrop-blur-md",
          "border-2 border-amber-500/40 hover:border-amber-400",
          "shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.45)]",
          "transition-all duration-300 transform hover:scale-105 active:scale-95",
          "cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50",
          isOpen && "ring-2 ring-amber-400 border-amber-400 bg-stone-900"
        )}
        aria-label="Buka Menu Aksesibilitas Web"
        title="Menu Aksesibilitas (Ukuran teks, kontras, narator)"
      >
        <Accessibility className="w-7 h-7 text-amber-400 group-hover:text-amber-300 transition-colors" />
        
        {/* Indikator aktif bila ada fitur aksesibilitas yang sedang diubah */}
        {(fontSize !== "normal" || highContrast || isSpeaking) && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-stone-900"></span>
          </span>
        )}
      </button>

      {/* ================= POPOVER MENU KONTROL AKSESIBILITAS ================= */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={cn(
            "fixed bottom-22 left-4 sm:left-6 z-50",
            "w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden",
            "bg-stone-950/95 dark:bg-stone-950/95 backdrop-blur-xl",
            "border border-amber-500/35 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.2)]",
            "text-stone-100",
            "animate-in fade-in slide-in-from-bottom-4 duration-200"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-800/80 bg-stone-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Accessibility className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-stone-100 tracking-wide">
                  Aksesibilitas Web
                </h3>
                <p className="text-[0.7rem] text-stone-400">
                  WaraNusa — Ramah Akses untuk Semua
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Tutup menu aksesibilitas"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Konten Menu */}
          <div className="p-4 space-y-4">
            {/* 1. Pengatur Ukuran Font */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Ukuran Teks Halaman</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleFontSizeChange("normal")}
                  className={cn(
                    "py-2 px-2.5 text-xs rounded-xl font-medium border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    fontSize === "normal"
                      ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-850"
                  )}
                >
                  <span className="text-xs">A</span>
                  <span className="text-[0.65rem] opacity-80">100% (Normal)</span>
                </button>

                <button
                  onClick={() => handleFontSizeChange("medium")}
                  className={cn(
                    "py-2 px-2.5 text-xs rounded-xl font-medium border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    fontSize === "medium"
                      ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-850"
                  )}
                >
                  <span className="text-sm font-semibold">A+</span>
                  <span className="text-[0.65rem] opacity-80">110% (Sedang)</span>
                </button>

                <button
                  onClick={() => handleFontSizeChange("large")}
                  className={cn(
                    "py-2 px-2.5 text-xs rounded-xl font-medium border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5",
                    fontSize === "large"
                      ? "bg-amber-500 text-stone-950 border-amber-400 font-bold shadow-md"
                      : "bg-stone-900 text-stone-300 border-stone-800 hover:border-amber-500/40 hover:bg-stone-850"
                  )}
                >
                  <span className="text-base font-bold">A++</span>
                  <span className="text-[0.65rem] opacity-80">125% (Besar)</span>
                </button>
              </div>
            </div>

            <div className="border-t border-stone-800/80" />

            {/* 2. Mode Kontras Tinggi */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Kontras Tinggi</span>
                </div>
                <p className="text-[0.7rem] text-stone-400">
                  Perjelas teks &amp; batasan elemen
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                role="switch"
                aria-checked={highContrast}
                onClick={handleToggleHighContrast}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-stone-950",
                  highContrast ? "bg-amber-500" : "bg-stone-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    highContrast ? "translate-x-5 bg-stone-950" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            <div className="border-t border-stone-800/80" />

            {/* 3. Narator Suara (Text-to-Speech) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-stone-300">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <span>Narator Suara (Audio)</span>
                </div>
                {isSpeaking && (
                  <span className="flex items-center gap-1.5 text-[0.65rem] text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Membaca...
                  </span>
                )}
              </div>

              {speechSupported ? (
                <div className="flex items-center gap-2">
                  {!isSpeaking ? (
                    <button
                      onClick={handleStartSpeech}
                      className="flex-1 py-2 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 text-stone-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Bacakan Halaman Ini</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopSpeech}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                      <span>Hentikan Suara</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[0.7rem] text-stone-500">
                  Browser Anda belum mendukung Web Speech API bawaan.
                </p>
              )}
            </div>

            <div className="border-t border-stone-800/80" />

            {/* 4. Tombol Reset */}
            <button
              onClick={handleReset}
              className="w-full py-2 px-3 rounded-xl bg-stone-900/60 hover:bg-stone-850 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
              <span>Kembalikan ke Kondisi Bawaan (Reset)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
