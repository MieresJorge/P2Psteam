// src/app/api/steam/get-price/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { appId } = await request.json();

  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
  }

  try {
    // Consultamos la API de Steam pidiendo los precios para Argentina (AR)
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=AR&l=spanish`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API responded with status ${response.status}`);
    }

    const data = await response.json();

    // La respuesta de Steam es un poco compleja, navegamos hasta el precio
    const appData = data[appId];

    if (appData.success && appData.data?.price_overview) {
      const priceData = appData.data.price_overview;
      // El precio viene en centavos, lo dividimos por 100 para obtener el valor real.
      const priceInArs = priceData.final / 100;
      return NextResponse.json({ price: priceInArs });
    } else {
      // Esto puede pasar si el juego es gratuito o no tiene precio definido
      return NextResponse.json({ error: 'Price not found for this app ID.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Error fetching Steam price:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}