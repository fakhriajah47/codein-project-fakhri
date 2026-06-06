import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Mangement - Project Command Center",
  description: "AI-powered project management command center for small teams, founders, and digital agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

