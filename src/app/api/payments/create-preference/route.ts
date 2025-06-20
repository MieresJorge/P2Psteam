// src/app/api/payments/create-preference/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { transactionId } = await request.json();

  if (!transactionId) {
    return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: 'Transaction not found or access denied' }, { status: 404 });
  }
  
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! 
  });
  const preference = new Preference(client);

  // Usamos nuestra nueva URL pública del archivo .env.local
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: transaction.id.toString(),
            title: `Compra de Saldo Steam (Juego: ${transaction.game_url})`,
            quantity: 1,
            unit_price: transaction.game_price_ars,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${siteUrl}/dashboard?payment_status=success`,
          failure: `${siteUrl}/dashboard?payment_status=failure`,
          pending: `${siteUrl}/dashboard?payment_status=pending`,
        },
        auto_return: 'approved',
        external_reference: transaction.id.toString(),
        // Ahora la URL de notificación también es pública y podemos probarla en el futuro
        notification_url: `${siteUrl}/api/payments/webhook`,
      }
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error(error);
    // Devolvemos el mensaje de error de Mercado Pago si existe
    const errorMessage = error?.cause?.[0]?.description || 'Failed to create payment preference';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}