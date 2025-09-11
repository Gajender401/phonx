import type { Metadata } from "next";
import { Lato, Quicksand } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/GlobalContext";
import { AudioProvider } from "@/context/AudioContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import QueryProvider from "@/providers/QueryProvider";
import GlobalLoader from "@/components/GlobalLoader";

const lato = Lato({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lato",
});

const quicksand = Quicksand({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-quicksand",
});

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
    <html lang="en" className={`${lato.variable} ${quicksand.variable}`}>
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
