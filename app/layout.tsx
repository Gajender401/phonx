import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/GlobalContext";
import { AudioProvider } from "@/context/AudioContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/providers/QueryProvider";
import GlobalLoader from "@/components/GlobalLoader";


export const metadata: Metadata = {
  title: "Phonxai",
  description: "Phonxai is a ai service call management system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>
          <AppProvider>
            <AudioProvider>
              <QueryProvider>
                <TooltipProvider>
                  <GlobalLoader />
                  <Toaster />
                  {children}
                </TooltipProvider>
              </QueryProvider>
            </AudioProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
