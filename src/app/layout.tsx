import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "M.A.K Indoor Pool | Kerala's Premier Indoor Swimming Pool (Moonniyur)",
  description: "Book public swimming sessions and exclusive family indoor pool slots online. Pristine water quality, temperature control, and complete family privacy in Kalathingalpara, Moonniyur, Malappuram, Kerala.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-clip">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-lagoon-500 selection:text-ocean-950 overflow-x-clip">
        <Navbar />
        <main className="flex-1 overflow-x-clip">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
