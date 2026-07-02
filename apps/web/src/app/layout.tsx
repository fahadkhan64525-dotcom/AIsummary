import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Text Summarization Platform",
  description: "Startup-grade AI summarization for text, PDFs, multilingual briefs, and document chat.(Fahad)"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
