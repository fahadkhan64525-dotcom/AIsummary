"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          richColors
          theme="system"
          toastOptions={{
            style: {
              borderRadius: "18px"
            }
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

