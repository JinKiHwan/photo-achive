import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PHOTO ARCHIVE — 개인 출사 사진집",
  description: "출사별 사진을 한 권의 미니멀한 사진집처럼 감상하고 기록하는 개인 디지털 웹 아카이브",
  keywords: ["출사", "사진집", "사진 아카이브", "photobook", "photography", "leica", "fujifilm", "sony"],
  authors: [{ name: "Photo Archive" }],
  openGraph: {
    title: "PHOTO ARCHIVE — 개인 출사 사진집",
    description: "출사별 사진을 한 권의 미니멀한 사진집처럼 감상하고 기록하는 개인 웹 아카이브",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${cormorant.variable} ${inter.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-[#0f0f11] text-zinc-100 selection:bg-zinc-800 selection:text-white relative">
        {/* Subtle Dim Overlay layer between background image and content */}
        <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

        <AuthProvider>
          <div className="relative z-10 flex flex-col min-h-screen flex-1">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
