import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { NetworkProvider } from "@/components/NetworkContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "XLMSCAN — Ask Stellar Anything",
  description:
    "Plain-English Stellar blockchain explorer. Look up wallets, transactions, and ask natural-language questions backed by verified on-chain data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
        <Suspense fallback={<div className="h-14 border-b border-zinc-200 bg-white" />}>
          <NetworkProvider>
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
          </NetworkProvider>
        </Suspense>
      </body>
    </html>
  );
}
