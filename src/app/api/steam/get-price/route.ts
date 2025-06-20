// src/app/api/steam/get-price/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { appId } = await request.json();

  if (!appId) {
    return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
  }

  try {
    // La consulta a la API de Steam no cambia
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=AR&l=spanish`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API responded with status ${response.status}`);
    }

    const data = await response.json();
    const appData = data[appId];

    if (appData.success && appData.data?.price_overview) {
      const priceData = appData.data.price_overview;
      
      // Obtenemos el precio y la moneda
      const priceValue = priceData.final / 100;
      const currency = priceData.currency; // Ej: "USD"

      // --- CAMBIO CLAVE: Devolvemos un objeto con precio y moneda ---
      return NextResponse.json({ price: priceValue, currency: currency });

    } else {
      // Esto puede pasar si el juego es gratuito o no tiene precio definido
      return NextResponse.json({ error: 'Price not found for this app ID.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error("Error fetching Steam price:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}