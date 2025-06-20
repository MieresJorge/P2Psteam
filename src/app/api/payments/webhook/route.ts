// src/app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.type === 'payment') {
    const paymentId = body.data.id;
    console.log("Webhook: Recibida notificación de pago de MP:", paymentId);

    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! });
    const payment = new Payment(client);

    try {
      const paymentInfo = await payment.get({ id: paymentId });
      
      if (paymentInfo.status === 'approved' && paymentInfo.external_reference) {
        const transactionId = paymentInfo.external_reference;

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Obtenemos los detalles de la transacción para saber cuánto reservar y en qué publicación
        const { data: transaction, error: txError } = await supabaseAdmin
          .from('transactions')
          .select('listing_id, game_price_ars')
          .eq('id', transactionId)
          .single();

        if (txError || !transaction) throw new Error(`Transacción ${transactionId} no encontrada.`);

        // --- PASO CLAVE: LLAMAMOS A LA FUNCIÓN PARA RESERVAR EL SALDO ---
        const { error: rpcError } = await supabaseAdmin.rpc('increment_reserved_amount', {
          p_listing_id: transaction.listing_id,
          p_amount_to_reserve: transaction.game_price_ars
        });

        if (rpcError) throw rpcError;

        console.log(`Webhook: Saldo de ${transaction.game_price_ars} reservado para la publicación ${transaction.listing_id}.`);
        // --------------------------------------------------------------------

        // Después de reservar, actualizamos el estado de la transacción
        const { error: updateError } = await supabaseAdmin
          .from('transactions')
          .update({ 
            status: 'pending_delivery',
            mercado_pago_payment_id: paymentId.toString(),
          })
          .eq('id', transactionId);

        if (updateError) throw updateError;
        
        console.log(`Webhook: Transacción ${transactionId} actualizada a 'pending_delivery' exitosamente.`);
      }
    } catch (error) {
      console.error("Error al procesar el webhook:", error);
      return new NextResponse("Error processing webhook", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}