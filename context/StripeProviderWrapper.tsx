// ARQUITECTURA: Componente de Cliente.
// Inicializa Stripe.js en el NAVEGADOR.
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

// -----------------------------------------------------------------
// ¡MISIÓN CRÍTICA! (Ver instrucciones después del código)
// -----------------------------------------------------------------
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Cargamos la instancia de Stripe (devuelve una promesa)
const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// -----------------------------------------------------------------

export const StripeProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  
  if (!stripePromise) {
    // Esto es una salvaguarda. Si la clave no está, no envolvemos 
    // la app con Stripe para evitar un crash.
    console.warn("ADVERTENCIA: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está definida. La Tienda no funcionará.");
    return <>{children}</>;
  }

  return (
    // El 'Elements' provider es el que permite a los componentes
    // de formulario (ej. CardElement) acceder a Stripe.
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};