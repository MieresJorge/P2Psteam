// src/app/api/payouts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { transactionId } = await request.json();
  const supabase = createRouteHandlerClient({ cookies });

  console.log(`[PAYOUT API] Petición recibida para finalizar transacción #${transactionId}`);

  // 1. Verificar el usuario actual (el comprador que confirma)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Obtener la transacción y verificar que el usuario es el comprador
  //    y que el estado es 'pending_confirmation'.
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .eq('status', 'pending_confirmation')
    .single();

  if (txError || !transaction) {
    return NextResponse.json({ error: 'Transacción no válida para finalizar.' }, { status: 400 });
  }

  // 3. Usar el cliente de Administrador para realizar las operaciones críticas
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // --- LÓGICA NUEVA: ACREDITAR SALDO EN LA BILLETERA INTERNA ---
    // 4. Llamamos a nuestra función de base de datos para sumar el saldo al perfil del vendedor
    console.log(`[PAYOUT API] Acreditando ${transaction.payout_amount_ars} ARS al vendedor ${transaction.seller_id}`);
    
    const { error: rpcError } = await supabaseAdmin.rpc('add_to_balance', {
      p_user_id: transaction.seller_id,
      p_amount_to_add: transaction.payout_amount_ars
    });

    if (rpcError) {
      // Si falla la acreditación, no continuamos y lanzamos un error.
      console.error("[PAYOUT API] Falló la llamada a RPC 'add_to_balance':", rpcError);
      throw rpcError;
    }

    console.log(`[PAYOUT API] Saldo acreditado exitosamente al vendedor.`);

    // 5. Si la acreditación fue exitosa, AHORA sí marcamos la transacción como completada
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transaction.id);

    if (updateError) {
      throw updateError;
    }
    
    console.log(`[PAYOUT API] Transacción #${transactionId} marcada como 'completed'.`);
    return NextResponse.json({ success: true, message: 'Transacción completada y saldo acreditado.' });

  } catch (error: any) {
    console.error(`[PAYOUT API] Error al finalizar la transacción #${transactionId}:`, error);
    return NextResponse.json({ error: 'Hubo un error al acreditar el saldo al vendedor.' }, { status: 500 });
  }
}