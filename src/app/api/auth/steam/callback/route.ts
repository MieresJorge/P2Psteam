// src/app/api/auth/steam/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const params = requestUrl.searchParams;

  // 1. Validar la respuesta de Steam (esto ya lo teníamos)
  const validationParams = new URLSearchParams(params);
  validationParams.set('openid.mode', 'check_authentication');

  const validationResponse = await fetch('https://steamcommunity.com/openid/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: validationParams.toString(),
  });

  const validationText = await validationResponse.text();

  if (!validationText.includes('is_valid:true')) {
    return NextResponse.redirect(new URL('/dashboard?error=steam_validation_failed', request.url));
  }

  // 2. Extraer la Steam ID (esto ya lo teníamos)
  const steamId = params.get('openid.claimed_id')?.split('/').pop();
  if (!steamId) {
    return NextResponse.redirect(new URL('/dashboard?error=steam_id_not_found', request.url));
  }

  // 3. Obtener el usuario actual de Supabase (esto ya lo teníamos)
  const supabaseUserClient = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabaseUserClient.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth-ui?error=not_logged_in', request.url));
  }

  // ---- NUEVO PASO: OBTENER DATOS DEL PERFIL DE STEAM ----
  let steamProfileData = {};
  try {
    const apiKey = process.env.STEAM_API_KEY;
    const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`);
    const data = await response.json();
    if (data.response.players.length > 0) {
      const player = data.response.players[0];
      steamProfileData = {
        name: player.personaname, // Guardamos el nombre
        avatar_url: player.avatarfull, // Guardamos el avatar
      };
    }
  } catch (error) {
    console.error("Error al obtener perfil de Steam:", error);
    // No detenemos el flujo, simplemente no tendremos el nombre y avatar.
  }
  // ----------------------------------------------------

  // 4. Usar el cliente de Administrador para actualizar los metadatos
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    // Ahora guardamos la ID, el nombre y el avatar, todo junto.
    { user_metadata: { ...user.user_metadata, steam_id: steamId, ...steamProfileData } }
  );

  if (updateError) {
    return NextResponse.redirect(new URL(`/dashboard?error=${updateError.message}`, request.url));
  }

  // 5. Todo salió bien, redirigir al dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url));
}