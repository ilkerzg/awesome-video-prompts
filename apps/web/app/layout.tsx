import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { Toaster } from "@workspace/ui/components/ui/sonner";
import { LayoutWrapper } from "../components/layout-wrapper";
import { AnalyticsProvider } from "../components/analytics";

import "@workspace/ui/globals.css";
import { metadata } from '../config/metadata';

const lexend = localFont({
  src: "../public/fonts/Lexend-VariableFont_wght.ttf",
  variable: "--font-lexend",
  weight: "100 900",
  display: "swap",
});

export { metadata };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <AnalyticsProvider />

      <meta name="apple-mobile-web-app-title" content="Awesome Video Prompts" />
      </head>
      <body className={`${lexend.variable} bg-muted/30 antialiased`}>
        <SpeedInsights />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
