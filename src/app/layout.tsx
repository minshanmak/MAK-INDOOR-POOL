import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "M.A.K Indoor Pool | Kerala's Premier Indoor Swimming Pool (Moonniyur)",
  description: "Book public swimming sessions and exclusive family indoor pool slots online. Pristine water quality, temperature control, and complete family privacy in Kalathingalpara, Moonniyur, Malappuram, Kerala.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className={`${plusJakarta.className} min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-lagoon-500 selection:text-ocean-950 font-sans`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

