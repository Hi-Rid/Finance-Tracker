import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { RouteProgress } from "@/components/shared/route-progress";
import { GlobalLoadingOverlay } from "@/components/shared/global-loading-overlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synmony - Your Second Brain for Your Money",
  description:
    "Semua tentang uang Anda dalam satu sistem. Transaksi, budget, aset, investasi, dan tujuan - terhubung dalam harmoni.",
  applicationName: "Synmony",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <RouteProgress />
          </Suspense>
          <GlobalLoadingOverlay />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}