// src/app/api/deposits/create-preference/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const { amount } = await request.json();

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'A valid amount is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // 1. Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Crear un registro en la tabla 'deposits' con estado 'pending'
  const { data: deposit, error: depositError } = await supabase
    .from('deposits')
    .insert({
      user_id: user.id,
      amount_ars: amount,
      status: 'pending',
    })
    .select()
    .single();

  if (depositError) {
    console.error("Error creating deposit record:", depositError);
    return NextResponse.json({ error: 'Could not create deposit record.' }, { status: 500 });
  }
  
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN! 
  });
  const preference = new Preference(client);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  try {
    const result = await preference.create({
      body: {
        items: [
          {
            id: `deposit-${deposit.id}`, // Prefijo para identificarlo
            title: `Carga de ${amount} créditos para SteamP2P`,
            quantity: 1,
            unit_price: amount,
            currency_id: 'ARS',
          },
        ],
        back_urls: {
          success: `${siteUrl}/dashboard?deposit_status=success`,
          failure: `${siteUrl}/dashboard?deposit_status=failure`,
          pending: `${siteUrl}/dashboard?deposit_status=pending`,
        },
        auto_return: 'approved',
        // 3. Usamos el ID del depósito como referencia externa
        external_reference: deposit.id.toString(), 
        notification_url: `${siteUrl}/api/payments/webhook`,
      }
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });

  } catch (error: any) {
    console.error(error);
    const errorMessage = error?.cause?.[0]?.description || 'Failed to create payment preference';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}