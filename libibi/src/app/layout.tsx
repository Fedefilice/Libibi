import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeaderNavigation, Navigation, AuthNavigation } from "./components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libibi",
  description: "Scopri e condividi libri con Libibi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[var(--color-background)]`}
      >
        <nav className="flex items-center justify-between px-8 py-6 bg-[var(--color-foreground)]">
          <HeaderNavigation />
          <div className="flex items-center space-x-6">
            <Navigation />
          </div>
        </nav>
        <main className="flex-1 bg-[var(--color-background)]">{children}</main>
        <footer className="px-8 py-6 bg-[var(--color-foreground)] flex justify-center items-center">
          <p className="text-base text-center text-[var(--color-accent)]">
            2025 Libibi ©. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
