import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Suspense } from 'react';
import Footer from '@/components/Footer';
import Loading from './loading';
import ScrollToTop from "@/components/ScrollToTop";
import SessionInitializer from '@/components/SessionInitializer';
import AuthSessionInitializer from '@/components/AuthSessionInitializer';
import ThemeInitializer from '@/components/ThemeInitializer';
import "./globals.css";
import Navbar from '@/components/Navbar';

export const metadata = {
  title: "Monobar",
  description: "Monobar by DWS",
};

export default function RootLayout({ 
  children 
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-base-100 text-base-content min-h-screen">
        <ThemeInitializer />
        <SessionInitializer />
        <AuthSessionInitializer />
        <Navbar/>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
        <Footer/>
      </body>
    </html>
  );
}
