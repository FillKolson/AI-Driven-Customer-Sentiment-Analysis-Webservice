import { TempoInit } from "@/components/tempo-init";
import GlobalUsageNotification from "@/components/global-usage-notification";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SentimentScope - AI-Powered Customer Sentiment Analysis",
  description:
    "Transform customer feedback into actionable insights with AI-powered sentiment analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script src="https://api.tempolabs.ai/proxy-asset?url=https://storage.googleapis.com/tempo-public-assets/error-handling.js" />
      <body className={inter.className}>
        <GlobalUsageNotification />
        {children}
        <TempoInit />
      </body>
    </html>
  );
}
