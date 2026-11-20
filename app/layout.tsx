import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { NetworkProvider } from "@/components/NetworkContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "XLMSCAN — Ask Stellar Anything",
  description:
    "Plain-English Stellar blockchain explorer. Look up wallets, transactions, and ask a question in natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#06080f] text-slate-50 cosmic-grid selection:bg-cyan-500/30 selection:text-cyan-200">
        <Suspense
          fallback={
            <div className="h-14 border-b border-white/10 bg-[#06080f]/90" />
          }
        >
          <NetworkProvider>
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
          </NetworkProvider>
        </Suspense>
      </body>
    </html>
  );
}
