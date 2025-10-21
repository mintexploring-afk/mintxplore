import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appName = process.env.APP_NAME || "Opalineart";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: `${appName} - Premium NFT Marketplace`,
    template: `%s | ${appName}`
  },
  description: "Discover, collect, and trade unique digital art and NFTs on Opalineart. Join our vibrant community of creators and collectors in the world of blockchain-based digital assets.",
  keywords: ["NFT", "NFT Marketplace", "Digital Art", "Blockchain", "Crypto Art", "Web3", "Collectibles", "Opalineart"],
  authors: [{ name: appName }],
  creator: appName,
  publisher: appName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    title: `${appName} - Premium NFT Marketplace`,
    description: "Discover, collect, and trade unique digital art and NFTs on Opalineart. Join our vibrant community of creators and collectors.",
    siteName: appName,
    images: [
      {
        url: `${appUrl}/hero.jpg`,
        width: 1200,
        height: 630,
        alt: `${appName} - NFT Marketplace`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${appName} - Premium NFT Marketplace`,
    description: "Discover, collect, and trade unique digital art and NFTs on Opalineart.",
    images: [`${appUrl}/hero.jpg`],
    creator: `@${appName}`,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  verification: {
    // Add your verification tokens when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
