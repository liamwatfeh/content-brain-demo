import type { Metadata } from "next";
import { Inter, Unbounded, Archivo } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { AuthProvider } from "@/contexts/AuthContext";
import PasswordModal from "@/components/PasswordModal";
import React from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
});

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Content Brain - Transform White Papers into Marketing Campaigns",
  description:
    "AI-powered platform that converts your research documents into articles, LinkedIn posts, and social media content in minutes.",
  keywords:
    "AI content generation, white paper marketing, content automation, marketing campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${unbounded.variable} ${archivo.variable} font-sans antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <SidebarProvider>
            <div className="relative">{children}</div>
            <PasswordModal />
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
