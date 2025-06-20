// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner'; // 1. Importamos el Toaster

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SteamP2P",
  description: "Vende tu saldo de Steam de forma segura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {/* 2. Añadimos el componente Toaster aquí */}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}