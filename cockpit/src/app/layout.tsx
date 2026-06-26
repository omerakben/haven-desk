import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/CommandPalette";

export const metadata: Metadata = {
  title: "Haven Desk",
  description: "Private AI for the work of daily life. Runs locally on your machine.",
  icons: [{ rel: "icon", url: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen flex-col overflow-hidden md:flex-row">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
          </div>
          <Toaster />
          <CommandPalette />
        </ThemeProvider>
      </body>
    </html>
  );
}
