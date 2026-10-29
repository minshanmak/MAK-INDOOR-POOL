import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "M.A.K Indoor Pool | Kerala's Premier Indoor Swimming Pool",
  description: "Book public swimming sessions and exclusive family indoor pool slots online. Pristine water quality, temperature control, and complete family privacy in Aluva, Kerala.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-lagoon-500 selection:text-ocean-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

