import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Archivo 9
import { Toaster } from "react-hot-toast"; // package.json

// Providers (Próximos archivos)
import { FirebaseProvider } from "@/context/FirebaseProvider";
import { StripeProviderWrapper } from "@/context/StripeProviderWrapper";

// Layout Components (Próximos archivos)
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

// Su metadata (verificada)
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
        {/* Arquitectura de App Hosting (SSR + Cliente):
          Estos providers 'use client' envuelven toda la app, 
          dando acceso a Auth y Stripe a todos los componentes hijos.
        */}
        <FirebaseProvider>
          <StripeProviderWrapper>
            
            <div className="flex flex-col min-h-screen">
              
              {/* Sistema de Notificaciones Global */}
              <Toaster 
                position="top-center"
                toastOptions={{
                  className: '!bg-zenit-light !text-white',
                  success: { iconTheme: { primary: 'var(--zenit-success)', secondary: 'white' } },
                  error: { iconTheme: { primary: 'var(--zenit-error)', secondary: 'white' } },
                }}
              />
              
              {/* Componente de Header (Aquí pondremos su HTML) */}
              <Header /> 
              
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>

              {/* Componente de Footer (Aquí pondremos su HTML) */}
              <Footer />
            </div>

          </StripeProviderWrapper>
        </FirebaseProvider>
      </body>
    </html>
  );
}