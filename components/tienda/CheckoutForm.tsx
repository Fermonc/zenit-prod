// ==========================================================
// ARCHIVO 22: components/tienda/CheckoutForm.tsx (Refactorizado)
// ==========================================================
"use client";

import { useState } from "react";
import { PaqueteZenit } from "@/types/definitions"; // <-- CAMBIO CLAVE
import { useFirebase } from "@/context/FirebaseProvider";
import { httpsCallable } from "firebase/functions";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#FFFFFF",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": { color: "#a0aec0" },
    },
    invalid: { color: "#D63031", iconColor: "#D63031" },
  },
};

interface CheckoutFormProps {
  paquete: PaqueteZenit;
  onCancel: () => void;
}

export const CheckoutForm = ({ paquete, onCancel }: CheckoutFormProps) => {
  const { functions } = useFirebase();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!stripe || !elements) return;
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setLoading(true);
    let clientSecret: string;

    try {
      const crearIntentoDePago = httpsCallable(functions, "crearIntentoDePago");
      const result = await crearIntentoDePago({ paqueteId: paquete.id });
      const data = result.data as { success: boolean; clientSecret?: string };
      if (!data.success || !data.clientSecret) {
        throw new Error("No se pudo obtener el 'clientSecret' del servidor.");
      }
      clientSecret = data.clientSecret;

      const paymentResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message || "Falló la confirmación del pago.");
      } 
      
      if (paymentResult.paymentIntent.status === "succeeded") {
        toast.success("¡Pago completado con éxito! Tus fichas serán acreditadas.");
        onCancel();
      }
    } catch (err: any) {
      console.error("Error en el proceso de pago:", err);
      setError(err.message || "Ocurrió un error desconocido.");
      toast.error(err.message || "Ocurrió un error desconocido.");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto max-w-lg py-12">
      <div className="bg-zenit-light p-8 rounded-lg shadow-xl">
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-white mb-2">
            Pagar por {paquete.nombre}
          </h3>
          <p className="text-gray-400">
            Comprarás <span className="text-zenit-primary font-bold">{paquete.fichasZenit} Fichas</span> 
            por un total de <span className="text-zenit-primary font-bold">${paquete.precioMonedaReal.toFixed(2)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="p-4 bg-zenit-dark rounded-lg">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            {error && (
              <div className="text-zenit-error text-center font-semibold">{error}</div>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!stripe || !elements || loading}
                className="flex-1 bg-zenit-success hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                {loading ? "Procesando..." : `Pagar $${paquete.precioMonedaReal.toFixed(2)}`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};