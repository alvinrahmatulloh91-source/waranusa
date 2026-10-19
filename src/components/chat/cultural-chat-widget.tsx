"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, RotateCcw, MoreHorizontal, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Selamat datang di WaraNusa! Saya Karsa, panduan budaya AI Anda. Ada yang bisa saya bantu hari ini?",
};

const QUICK_PROMPTS = ["Filosofi Joglo", "Gamelan Saron", "Sejarah Batik"];

const STORAGE_KEY = "waranusa_karsa_messages";

/**
 * Medallion Icon khas Karsa (Motif mandala emas dengan aksen zamrud di tengah)
 * Didesain persis menyerupai avatar pada tangkapan layar kurator Karsa.
 */
function KarsaMedallion({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("w-10 h-10 select-none shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="goldPlate" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF1B8" />
          <stop offset="35%" stopColor="#D4AF37" />
          <stop offset="75%" stopColor="#AA7C11" />
          <stop offset="100%" stopColor="#5B4307" />
        </radialGradient>
        <linearGradient id="emeraldCenter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>
      </defs>

      {/* Lingkaran Luar Emas Gerigi/Batik */}
      <circle cx="50" cy="50" r="48" fill="url(#goldPlate)" stroke="#2B1E05" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#FDE047" strokeWidth="0.8" strokeDasharray="2,2" />

      {/* Motif Ornamen Sudut 8 Penjuru Angin */}
      <g stroke="#614605" strokeWidth="1.2" fill="none" opacity="0.85">
        <circle cx="50" cy="50" r="36" />
        <path d="M50 14 L50 86 M14 50 L86 50" />
        <path d="M25 25 L75 75 M25 75 L75 25" />
        <polygon points="50,18 56,34 72,28 64,44 80,50 64,56 72,72 56,66 50,82 44,66 28,72 36,56 20,50 36,44 28,28 44,34" fill="#C59B27" opacity="0.6" />
      </g>

      {/* Cincin Lingkar Dalam */}
      <circle cx="50" cy="50" r="24" fill="#17221C" stroke="#FDE047" strokeWidth="1.5" />

      {/* Pusat Berlian Zamrud (Emerald Emblem) */}
      <polygon points="50,30 66,50 50,70 34,50" fill="url(#emeraldCenter)" stroke="#6EE7B7" strokeWidth="1" />
      {/* Daun / Motif Semanggi Pusat */}
      <circle cx="50" cy="50" r="5" fill="#ECFDF5" />
      <path d="M50 38 L50 62 M38 50 L62 50" stroke="#047857" strokeWidth="1.2" />
    </svg>
  );
}

export function CulturalChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil riwayat chat dari sessionStorage saat mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Abaikan bila storage gagal dibaca
    }
  }, []);

  // Simpan riwayat chat ke sessionStorage setiap kali bertambah
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Abaikan bila quota storage penuh
    }
  }, [messages]);

  // Auto-scroll ke bagian pesan terbaru
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Fokus ke input saat chat window dibuka
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) {
        throw new Error("Gagal menerima balasan");
      }

      const data = await res.json();
      const botReply = data.content || "Terima kasih atas pertanyaannya seputar budaya Nusantara.";

      setMessages((prev) => [...prev, { role: "assistant", content: botReply }]);
    } catch (err) {
      console.error("[Chat Error]:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Mohon maaf, terjadi kendala saat memproses jawaban. Silakan ajukan pertanyaan kembali.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const resetChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setShowMenu(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
  };

  return (
    <>
      {/* ================= FLOATING TRIGGER BUTTON ================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "group flex items-center justify-center",
            "w-14 h-14 rounded-full",
            "bg-[#111722] border-2 border-[#D4AF37]/80 hover:border-[#D4AF37]",
            "shadow-[0_0_24px_rgba(212,175,55,0.4)] hover:shadow-[0_0_32px_rgba(212,175,55,0.65)]",
            "transition-all duration-300 transform hover:scale-105 active:scale-95",
            "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
          )}
          aria-label="Buka Chatbot Budaya Karsa"
          title="Tanya Karsa - Panduan Budaya AI"
        >
          <div className="relative flex items-center justify-center w-full h-full p-1.5">
            <KarsaMedallion className="w-10 h-10 transition-transform duration-300 group-hover:rotate-6" />
            {/* Status online ping badge */}
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#111722]"></span>
            </span>
          </div>
        </button>
      )}

      {/* ================= CHATBOT POPOVER WINDOW ================= */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50",
            "w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[calc(100vh-2.5rem)]",
            "flex flex-col rounded-3xl overflow-hidden",
            "bg-[#111722]/95 backdrop-blur-xl border border-[#c5a059]/40",
            "shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.2)]",
            "animate-in fade-in slide-in-from-bottom-5 duration-200"
          )}
        >
          {/* ============ HEADER ============ */}
          <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-[#0f151f]/90 select-none">
            <div className="flex items-center gap-3">
              <KarsaMedallion className="w-10 h-10 shadow-sm" />
              <div className="flex flex-col">
                <span className="text-white font-semibold text-[0.95rem] tracking-wide leading-tight">
                  Karsa - Panduan Budaya AI
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#22c55e] font-medium leading-none mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block animate-pulse"></span>
                  online
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Menu 3 Titik */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  title="Opsi percakapan"
                  aria-label="Opsi percakapan"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[#192231] border border-white/10 shadow-xl py-1 text-xs text-slate-200 z-20">
                    <button
                      onClick={resetChat}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#D4AF37]/20 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Mulai Obrolan Baru</span>
                    </button>
                    <div className="my-1 border-t border-white/10" />
                    <div className="px-3.5 py-1.5 text-[0.7rem] text-slate-400">
                      WaraNusa AI Kurator v1.0
                    </div>
                  </div>
                )}
              </div>

              {/* Tombol Tutup */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup chat"
                aria-label="Tutup jendela chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============ MESSAGES CONTAINER ============ */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[86%]",
                    isAssistant ? "self-start items-start" : "self-end items-end ml-auto"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-3 text-sm leading-relaxed",
                      isAssistant
                        ? "bg-[#1c2433] text-slate-100 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm"
                        : "bg-[#D4AF37]/20 text-[#fdf8ee] border border-[#D4AF37]/45 rounded-2xl rounded-tr-sm shadow-sm"
                    )}
                  >
                    {isAssistant ? (
                      <div className="prose prose-invert prose-sm max-w-none space-y-2 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-[#FDE047] [&>h3]:mb-1 [&>h3]:mt-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="self-start items-start max-w-[85%]">
                <div className="px-4 py-3 bg-[#1c2433] text-slate-300 rounded-2xl rounded-tl-sm border border-white/5 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce"></span>
                  <span className="text-xs text-slate-400 ml-2">Karsa sedang merangkai info...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ============ FOOTER (QUICK PILLS & INPUT) ============ */}
          <div className="px-3.5 pb-3.5 pt-1.5 bg-[#0f151f]/95 border-t border-white/5 space-y-2.5">
            {/* Quick Prompt Pills (Persis desain gambar) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className={cn(
                    "text-xs px-3.5 py-1.5 rounded-full shrink-0 font-normal",
                    "bg-[#16202d] text-slate-200 border border-[#c5a059]/60",
                    "hover:border-[#D4AF37] hover:text-[#FDE047] hover:bg-[#D4AF37]/10",
                    "active:scale-95 transition-all duration-150 cursor-pointer shadow-sm",
                    "disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar Pill (Persis desain gambar) */}
            <div
              className={cn(
                "rounded-full bg-[#121824] border border-[#c5a059]/70",
                "focus-within:border-[#D4AF37] focus-within:ring-1 focus-within:ring-[#D4AF37]/40",
                "px-3.5 py-1.5 flex items-center gap-2 shadow-inner transition-all duration-200"
              )}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya tentang budaya..."
                disabled={isLoading}
                className="bg-transparent text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none flex-1 pl-1 disabled:opacity-50"
              />

              {/* Tombol Kirim Bundar Hijau Zamrud */}
              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  "bg-[#10b981] hover:bg-[#059669] text-white shadow-md",
                  "transition-all duration-150 active:scale-95 cursor-pointer",
                  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#10b981]"
                )}
                aria-label="Kirim pertanyaan"
                title="Kirim pertanyaan"
              >
                <Send className="w-3.5 h-3.5 translate-x-px" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
