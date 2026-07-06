import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DentAI — Diş Kliniği Asistanı",
  description:
    "Yapay zeka destekli diş kliniği asistanı. Randevu alın, tedavi bilgisi ve fiyatlar hakkında bilgi edinin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-primary)]">
        {children}
      </body>
    </html>
  );
}
