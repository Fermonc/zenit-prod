import type { Metadata } from "next";
import { Inter } from "next/font/google"; // <-- FUENTE INTER
import "./globals.css";
import { Toaster } from "react-hot-toast"; // <-- DEPENDENCIA

// Providers
import { FirebaseProvider } from "@/context/FirebaseProvider";
import { StripeProviderWrapper } from "@/context/StripeProviderWrapper";

// Layout Components
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zenit - Plataforma de Sorteos",
  description: "Participa en sorteos y gana premios exclusivos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-zenit-dark text-white`}>
        <FirebaseProvider>
          <StripeProviderWrapper>
            <div className="flex flex-col min-h-screen">
              <Toaster 
                position="top-center"
                toastOptions={{
                  className: '!bg-zenit-light !text-white',
                  success: { iconTheme: { primary: 'var(--zenit-success)', secondary: 'white' } },
                  error: { iconTheme: { primary: 'var(--zenit-error)', secondary: 'white' } },
                }}
              />
              <Header /> 
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </div>
          </StripeProviderWrapper>
        </FirebaseProvider>
      </body>
    </html>
  );
}