/*
================================================================
CEREBRO ZENIT V4.0 (MASTER PRODUCCIÓN)
- Integración completa de Stripe con registro de VENTAS.
- Motor de sorteos automatizado.
- Sistema de recompensas y pase de temporada.
================================================================
*/
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURACIÓN GLOBAL ---
const region = "us-central1";
setGlobalOptions({ region: region });

// --- SECRETOS ---
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// --- HELPER STRIPE ---
let stripeInstance: Stripe | null = null;
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey.value(), {
      apiVersion: "2025-10-29.clover" as any,
    });
  }
  return stripeInstance;
};

// ================================================================
// 1. onUsuarioCreado (Trigger Auth -> Firestore)
// Crea el perfil base cuando un usuario se registra.
// ================================================================
export const onUsuarioCreado = functions.region(region).auth.user().onCreate(async (user: functions.auth.UserRecord) => {
  const { email, uid } = user;
  const perfilUsuario = { 
    email: email, 
    uid: uid, 
    rol: "usuario", 
    fichasZenit: 5, // Bono de bienvenida
    fechaRegistro: admin.firestore.FieldValue.serverTimestamp(),
    paseTemporadaXP: 0,
    ultimoReclamoDiario: null,
    nivelesReclamados: []
  };
  try {
    await db.collection("usuarios").doc(uid).set(perfilUsuario);
    console.log(`[v4] Perfil creado para ${uid}`);
  } catch (error) {
    console.error(`ERROR al crear perfil para ${uid}:`, error);
  }
});

// ================================================================
// 2. gastarZenit (Callable)
// Función genérica para deducir fichas (útil para futuras features).
// ================================================================
export const gastarZenit = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Debes estar logueado.");
  const uid = context.auth.uid;
  const costo = data.costo; 
  if (!costo || typeof costo !== 'number' || costo <= 0) throw new functions.https.HttpsError("invalid-argument", "Costo inválido.");
  
  const usuarioRef = db.collection("usuarios").doc(uid);
  await db.runTransaction(async (t) => {
    const doc = await t.get(usuarioRef);
    const current = doc.data()?.fichasZenit || 0;
    if (current < costo) throw new functions.https.HttpsError("failed-precondition", "Fichas insuficientes.");
    t.update(usuarioRef, { fichasZenit: current - costo });
  });
  return { success: true };
});

// ================================================================
// 3. crearIntentoDePago (Callable)
// Inicia el proceso de compra de fichas con Stripe.
// ================================================================
export const crearIntentoDePago = functions.region(region).runWith({
  secrets: ["STRIPE_SECRET_KEY"]
}).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Debes estar logueado.");
  const { paqueteId } = data;
  if (!paqueteId) throw new functions.https.HttpsError("invalid-argument", "Falta paqueteId.");
  
  const paqueteDoc = await db.collection("paquetesZenit").doc(paqueteId).get();
  if (!paqueteDoc.exists) throw new functions.https.HttpsError("not-found", "Paquete no existe.");
  
  const stripe = getStripe();
  // Creamos el PaymentIntent en Stripe
  const paymentIntent = await stripe.paymentIntents.create({ 
    amount: Math.round(paqueteDoc.data()!.precioMonedaReal * 100), // En centavos
    currency: "usd", 
    metadata: { firebaseUID: context.auth.uid, paqueteId: paqueteId } 
  });
  
  return { success: true, clientSecret: paymentIntent.client_secret };
});

// ================================================================
// 4. stripeWebhook (HTTP v2)
// Verifica el pago con Stripe y entrega las fichas de forma segura.
// ¡AHORA REGISTRA VENTAS EN LA COLECCIÓN 'ventas'!
// ================================================================
export const stripeWebhook = onRequest(
  { secrets: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  async (request, response) => {
    const sig = request.headers["stripe-signature"];
    if (!sig) { response.status(400).send("Webhook Error: No signature"); return; }
    
    const stripe = getStripe();
    let event: Stripe.Event;
    try {
      // Verificación criptográfica de que el evento viene de Stripe real
      event = stripe.webhooks.constructEvent(request.rawBody, sig, stripeWebhookSecret.value());
    } catch (err: any) {
      console.error("Error de firma Webhook:", err.message);
      response.status(400).send(`Webhook Error: ${err.message}`); return;
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { firebaseUID, paqueteId } = pi.metadata;
      
      if (firebaseUID && paqueteId) {
        try {
          await db.runTransaction(async (t) => {
            const paqueteRef = db.collection("paquetesZenit").doc(paqueteId);
            const paqueteDoc = await t.get(paqueteRef);
            if (!paqueteDoc.exists) throw new Error("Paquete no encontrado durante webhook");
            const fichas = paqueteDoc.data()!.fichasZenit;

            // A. Entregar fichas al usuario
            t.update(db.collection("usuarios").doc(firebaseUID), { 
              fichasZenit: admin.firestore.FieldValue.increment(fichas) 
            });

            // B. Registrar la venta en el historial financiero
            t.set(db.collection("ventas").doc(pi.id), {
              userId: firebaseUID,
              paqueteId: paqueteId,
              montoUSD: pi.amount / 100,
              fichasCompradas: fichas,
              fechaCompra: admin.firestore.FieldValue.serverTimestamp(),
              stripePaymentId: pi.id,
              estado: "completado",
              metodo: pi.payment_method_types[0] || "tarjeta"
            });
          });
          console.log(`✅ [Webhook] Venta registrada y fichas entregadas a ${firebaseUID}`);
        } catch (e) {
          console.error("🚨 [Webhook] Error en transacción:", e);
          // Responder 200 OK para evitar bucle de reintentos de Stripe si el error no es recuperable
        }
      }
    }
    response.status(200).send({ received: true });
  }
);

// ================================================================
// 5. comprarBoleta (Callable)
// Transacción compleja para comprar un ticket de sorteo.
// ================================================================
export const comprarBoleta = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login requerido.");
  const uid = context.auth.uid;
  const { sorteoId, tipoBoleta, numeroElegido } = data; // tipoBoleta: 'azar' | 'elegida'

  if (!sorteoId) throw new functions.https.HttpsError("invalid-argument", "Falta sorteoId.");

  return db.runTransaction(async (t) => {
    const sorteoRef = db.collection("sorteos").doc(sorteoId);
    const userRef = db.collection("usuarios").doc(uid);
    const sorteoDoc = await t.get(sorteoRef);
    const userDoc = await t.get(userRef);

    if (!sorteoDoc.exists) throw new functions.https.HttpsError("not-found", "Sorteo no existe.");
    const sorteoData = sorteoDoc.data()!;
    if (sorteoData.estado !== 'financiando') throw new functions.https.HttpsError("failed-precondition", "Sorteo no disponible.");

    // Determinar costo
    const costo = tipoBoleta === 'elegida' ? sorteoData.precioBoletaElegida : sorteoData.precioBoleta;
    if (userDoc.data()!.fichasZenit < costo) throw new functions.https.HttpsError("failed-precondition", "Fichas insuficientes.");

    // Determinar número
    let numeroFinal = numeroElegido;
    if (tipoBoleta === 'azar' || !numeroFinal) {
      // Lógica simple de azar (en producción real, esto debería asegurar no-colisión)
      numeroFinal = Math.floor(Math.random() * 10000);
    }

    // Crear referencia para la nueva boleta (ID automático)
    const nuevaBoletaRef = sorteoRef.collection("boletas").doc();

    // Ejecutar cambios
    t.update(userRef, { fichasZenit: admin.firestore.FieldValue.increment(-costo) });
    t.update(sorteoRef, { recaudacionActual: admin.firestore.FieldValue.increment(1) });
    t.set(nuevaBoletaRef, {
      userId: uid,
      numero: numeroFinal,
      fechaCompra: admin.firestore.FieldValue.serverTimestamp(),
      sorteoId: sorteoId,
      costoFichas: costo
    });

    return { success: true, numeroComprado: numeroFinal };
  });
});

// ================================================================
// 6. revisarSorteos (Cron Job)
// Se ejecuta cada 15 minutos para avanzar el estado de los sorteos.
// ================================================================
export const revisarSorteos = functions.region(region).pubsub.schedule("every 15 minutes").onRun(async (context) => {
  const ahora = admin.firestore.Timestamp.now();
  const batch = db.batch();
  let cambios = 0;

  // A. Revisar sorteos que alcanzaron la meta -> pasar a 'cuentaRegresiva'
  const qFinanciando = await db.collection("sorteos")
    .where("estado", "==", "financiando")
    .get();
  
  qFinanciando.forEach(doc => {
    const data = doc.data();
    if (data.recaudacionActual >= data.metaRecaudacion) {
      // Meta alcanzada: Programar sorteo para dentro de 3 días (ejemplo)
      batch.update(doc.ref, {
        estado: "cuentaRegresiva",
        horaDeSorteo: admin.firestore.Timestamp.fromMillis(ahora.toMillis() + (3 * 24 * 60 * 60 * 1000))
      });
      cambios++;
    }
  });

  // B. Revisar sorteos en cuenta regresiva que ya llegaron a su hora -> pasar a 'sorteando'
  const qCuentaRegresiva = await db.collection("sorteos")
    .where("estado", "==", "cuentaRegresiva")
    .where("horaDeSorteo", "<=", ahora) // Ya pasó la hora
    .get();

  qCuentaRegresiva.forEach(doc => {
    batch.update(doc.ref, { estado: "sorteando" });
    cambios++;
  });

  if (cambios > 0) await batch.commit();
  console.log(`[Cron] Revisión completada. ${cambios} sorteos actualizados.`);
  return null;
});

// ================================================================
// 7. seleccionarGanador (Trigger Firestore)
// (v4.1 - Ahora guarda el email del ganador para el "Salón de la Fama")
// ================================================================
export const seleccionarGanador = functions.region(region).firestore
  .document("sorteos/{sorteoId}")
  .onUpdate(async (change, context) => {
    
    const newData = change.after.data();
    const oldData = change.before.data();
    const sorteoRef = change.after.ref;
    const sorteoId = context.params.sorteoId;

    // Solo actuar si el estado cambió a 'sorteando'
    if (newData.estado === "sorteando" && oldData.estado !== "sorteando") {
      console.log(`[Sorteo ${sorteoId}] Disparador 'seleccionarGanador' activado.`);
      
      try {
        // 1. Obtener todas las boletas
        const boletasSnap = await sorteoRef.collection("boletas").get();
        if (boletasSnap.empty) {
          console.error(`[Sorteo ${sorteoId}] No se encontraron boletas. Cancelando.`);
          return sorteoRef.update({ estado: "finalizado", ganadorUserId: "NADIE" });
        }

        // 2. Elegir ganador al azar
        const boletas = boletasSnap.docs;
        const indiceGanador = Math.floor(Math.random() * boletas.length);
        const boletaGanadora = boletas[indiceGanador].data();
        const ganadorUID = boletaGanadora.userId;

        // 3. ¡PASO PROFESIONAL! Obtener el email del ganador
        const usuarioGanadorDoc = await db.collection("usuarios").doc(ganadorUID).get();
        let emailGanador = "Email Oculto";
        if (usuarioGanadorDoc.exists) {
          // Ofuscamos el email por privacidad, ej: p...s@gmail.com
          const emailCompleto = usuarioGanadorDoc.data()?.email || "usuario@oculto.com";
          emailGanador = `${emailCompleto.substring(0, 1)}...${emailCompleto.substring(emailCompleto.indexOf('@'))}`;
        }
        
        console.log(`[Sorteo ${sorteoId}] Ganador: ${ganadorUID} (${emailGanador})`);

        // 4. Actualizar sorteo con todos los datos del ganador
        await sorteoRef.update({
          estado: "finalizado",
          ganadorUserId: ganadorUID,
          ganadorNumeroBoleta: boletaGanadora.numero,
          ganadorEmail: emailGanador, // <-- ¡DATO GUARDADO!
          fechaFinalizacion: admin.firestore.FieldValue.serverTimestamp()
        });

      } catch (error) {
        console.error(`Error al seleccionar ganador para ${sorteoId}:`, error);
        await sorteoRef.update({ estado: "error_al_sortear" });
      }
    }
    return null;
  });

// ================================================================
// 8. reclamarRecompensaDiaria (Callable)
// Entrega fichas y XP cada 24 horas.
// ================================================================
export const reclamarRecompensaDiaria = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login requerido.");
  const userRef = db.collection("usuarios").doc(context.auth.uid);
  
  const claimed = await db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    const last = doc.data()?.ultimoReclamoDiario?.toMillis() || 0;
    // Verificar si pasaron 24 horas (86400000 ms)
    if (Date.now() - last < 86400000) return false;
    
    t.update(userRef, {
      fichasZenit: admin.firestore.FieldValue.increment(2),    // +2 Fichas
      paseTemporadaXP: admin.firestore.FieldValue.increment(10), // +10 XP
      ultimoReclamoDiario: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  });

  if (!claimed) throw new functions.https.HttpsError("failed-precondition", "Vuelve mañana.");
  return { success: true, mensaje: "¡Has recibido 2 Fichas y 10 XP!" };
});

// ================================================================
// 9. reclamarRecompensaNivel (Callable)
// Entrega recompensa del Pase de Temporada si se cumple el XP.
// ================================================================
export const reclamarRecompensaNivel = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Login requerido.");
  const { nivelId } = data;
  if (!nivelId) throw new functions.https.HttpsError("invalid-argument", "Falta nivelId.");

  const userRef = db.collection("usuarios").doc(context.auth.uid);
  const nivelRef = db.collection("paseDeTemporada").doc(nivelId);

  const recompensa = await db.runTransaction(async (t) => {
    const userDoc = await t.get(userRef);
    const nivelDoc = await t.get(nivelRef);
    
    if (!nivelDoc.exists) throw new functions.https.HttpsError("not-found", "Nivel no existe.");
    const userData = userDoc.data()!;
    const nivelData = nivelDoc.data()!;

    // Validaciones
    if (userData.paseTemporadaXP < nivelData.XP_requerido) {
      throw new functions.https.HttpsError("failed-precondition", "XP insuficiente.");
    }
    if (userData.nivelesReclamados && userData.nivelesReclamados.includes(nivelId)) {
      throw new functions.https.HttpsError("already-exists", "Ya reclamado.");
    }

    // Entregar recompensa y marcar como reclamado
    t.update(userRef, {
      fichasZenit: admin.firestore.FieldValue.increment(nivelData.recompensa_fichas),
      nivelesReclamados: admin.firestore.FieldValue.arrayUnion(nivelId)
    });

    return nivelData.recompensa_fichas;
  });

  return { success: true, mensaje: `¡${recompensa} Fichas recibidas!` };
});