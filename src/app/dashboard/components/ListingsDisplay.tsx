// src/app/dashboard/components/ListingsDisplay.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import Image from "next/image";
import StarRating from "@/components/ui/StarRating";

// Actualizamos la interfaz para reflejar la nueva estructura de la BD
interface Listing {
  id: number;
  seller_id: string;
  usd_amount: number;
  sell_price_per_usd: number;
  reserved_amount_ars: number;
}
interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  avg_rating: number;
  sales_count: number;
}

export default async function ListingsDisplay() {
  const supabase = createClient();

  // La consulta ahora trae los nuevos campos
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'active');

  if (listingsError || !listings) {
    return <p className="text-red-500">Error al cargar las publicaciones.</p>;
  }

  // Lógica para buscar los perfiles, igual que antes
  const sellerIds = [...new Set(listings.map(l => l.seller_id))];
  let profiles: Profile[] = [];
  if (sellerIds.length > 0) {
    const { data: profilesData } = await supabase
      .rpc('get_user_profiles_by_ids', { user_ids: sellerIds });
    if (profilesData) {
      profiles = Array.isArray(profilesData) ? profilesData : [profilesData];
    }
  }
  const sellersMap = new Map(profiles.map(p => [p.id, p]));


  return (
    <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => {
        // --- LÓGICA COMPLETA PARA OBTENER LOS DATOS ---
        const seller = sellersMap.get(listing.seller_id);
        const sellerName = seller?.name || 'Usuario Desconocido';
        const sellerAvatar = seller?.avatar_url || '/default-avatar.png';
        const avgRating = seller?.avg_rating || 0;
        const salesCount = seller?.sales_count || 0;
        
        // --- NUEVO CÁLCULO DE SALDO DISPONIBLE EN USD ---
        const reservedUsd = listing.reserved_amount_ars / listing.sell_price_per_usd;
        const availableUsd = listing.usd_amount - reservedUsd;
        // --------------------------------------------------

        if (availableUsd < 0.01) return null;

        return (
          <Card key={listing.id} className="bg-gray-800 border-gray-700 text-white flex flex-col hover:border-sky-500 transition-all">
            <CardHeader>
              <Link href={`/profile/${listing.seller_id}`} className="flex items-center gap-3 group">
                <img 
                  src={sellerAvatar} 
                  alt={`Avatar de ${sellerName}`} 
                  width={40} 
                  height={40} 
                  className="rounded-full group-hover:ring-2 group-hover:ring-sky-400 transition-all"
                />
                <div className="flex-grow">
                    <CardTitle className="truncate group-hover:text-sky-400 transition-colors">{sellerName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={avgRating} size={16} />
                        <span className="text-xs text-gray-400">({salesCount} ventas)</span>
                    </div>
                </div>
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between">
              <div>
                <p className="text-lg font-bold text-green-400">
                  {listing.sell_price_per_usd.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} / dólar
                </p>
                <p className="text-gray-300">
                  Ofrece hasta <span className="font-bold text-white">${availableUsd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> USD
                </p>
              </div>
              <Button asChild className="w-full mt-4">
                <Link href={`/listing/${listing.id}`}>Ver Oferta</Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}