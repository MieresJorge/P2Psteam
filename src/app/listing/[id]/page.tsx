// src/app/listing/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PurchaseForm from "./components/PurchaseForm";

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: { user: buyer } } = await supabase.auth.getUser();

  // Buscamos la publicación con los nuevos campos en USD
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!listing || listingError) {
    notFound();
  }

  const { data: profile } = await supabase
    .rpc('get_user_profiles_by_ids', { user_ids: [listing.seller_id] })
    .returns<Profile[]>()
    .single();

  const sellerName = profile?.name || 'Usuario Desconocido';
  const sellerAvatar = profile?.avatar_url || '/default-avatar.png';

  // Calculamos el saldo disponible en USD
  const reservedUsd = listing.reserved_amount_ars / listing.sell_price_per_usd;
  const availableUsd = listing.usd_amount - reservedUsd;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sky-400 hover:underline mb-6 inline-block">&larr; Volver al Dashboard</Link>
        
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={sellerAvatar}
                alt={`Avatar de ${sellerName}`}
                width={64}
                height={64}
                className="rounded-full border-2 border-gray-600"
              />
              <div>
                <p className="text-sm text-gray-400">Vendido por</p>
                <h2 className="text-2xl font-bold">{sellerName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-400">Precio por Dólar</p>
                <p className="text-3xl font-bold text-green-400">{listing.sell_price_per_usd.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-400">Saldo Disponible</p>
                <p className="text-3xl font-bold">${availableUsd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</p>
              </div>
            </div>
            
            <hr className="my-8 border-gray-700"/>
            
            <div>
              {buyer && buyer.id !== listing.seller_id && (
                <PurchaseForm listing={listing} buyer={buyer} availableAmountUsd={availableUsd} />
              )}
              {buyer && buyer.id === listing.seller_id && (
                <div className="bg-gray-700 p-6 rounded-md text-center"><p className="text-gray-300">Estás viendo tu propia publicación.</p></div>
              )}
              {!buyer && (
                <div className="bg-gray-700 p-6 rounded-md text-center"><p className="text-gray-300">Debes <Link href="/auth-ui" className="text-sky-400 font-bold hover:underline">iniciar sesión</Link> para poder comprar.</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
