import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import FixViewport from "@/components/layout/FixViewport";
import GlobalStyles from "@/components/layout/GlobalStyles";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://occworldtrade.com'),
  title: {
    template: "%s | OCC World Trade",
    default: "OCC World Trade - Premium Bulk Products for Global Businesses",
  },
  description: "OCC World Trade offers high-quality bulk commodities and raw materials including rice, seeds, oil, raw polymers, and bromine salt for businesses worldwide.",
  keywords: ["OCC World Trade", "bulk products", "commodities", "rice", "seeds", "oil", "raw polymers", "bromine salt", "wholesale"],
  authors: [{ name: "OCC World Trade Team" }],
  openGraph: {
    type: 'website',
    url: 'https://occworldtrade.com',
    title: 'OCC World Trade - Premium Bulk Products for Global Businesses',
    description: 'High-quality bulk commodities and raw materials for businesses worldwide',
    siteName: 'OCC World Trade',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@occworldtrade',
    title: 'OCC World Trade - Premium Bulk Products',
    description: 'High-quality bulk commodities and raw materials for businesses worldwide',
  },
  alternates: {
    canonical: 'https://occworldtrade.com',
  },
  creator: "OCC World Trade",
  publisher: "OCC World Trade",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Tawk.to Live Chat Script */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
                var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                s1.async=true;
                s1.src='https://embed.tawk.to/687e53247697a01914a21d66/1j0mn9icl';
                s1.charset='UTF-8';
                s1.setAttribute('crossorigin','*');
                s0.parentNode.insertBefore(s1,s0);
              })();
            `
          }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <GlobalStyles />
        <FixViewport />
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-16">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
