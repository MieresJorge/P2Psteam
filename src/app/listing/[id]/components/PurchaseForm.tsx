// src/app/listing/[id]/components/PurchaseForm.tsx
'use client';

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import Link from "next/link";

interface Listing {
  id: number;
  seller_id: string;
  sell_price_per_usd: number;
}
interface PurchaseFormProps {
  listing: Listing;
  buyer: User;
  buyerBalance: number; // Saldo actual del comprador
  availableAmountUsd: number;
}

export default function PurchaseForm({ listing, buyer, buyerBalance, availableAmountUsd }: PurchaseFormProps) {
  const router = useRouter();
  const [gameUrl, setGameUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [gamePriceUSD, setGamePriceUSD] = useState<number | null>(null);

  const handleUrlChange = async (url: string) => {
    setGameUrl(url);
    setErrorMsg('');
    setGamePriceUSD(null);
    
    const match = url.match(/app\/(\d+)/);
    if (match && match[1]) {
      const appId = match[1];
      setPriceLoading(true);
      try {
        const response = await fetch('/api/steam/get-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId }),
        });
        const data = await response.json();
        if (data.price && data.currency === 'USD') {
          setGamePriceUSD(data.price);
        } else {
          setErrorMsg(data.error || "No se pudo obtener el precio de este juego.");
        }
      } catch (e) {
        setErrorMsg("Error al conectar con la API de Steam.");
      } finally {
        setPriceLoading(false);
      }
    }
  };
  
  const paymentAmountARS = useMemo(() => {
    if (!gamePriceUSD) return 0;
    return gamePriceUSD * listing.sell_price_per_usd;
  }, [gamePriceUSD, listing.sell_price_per_usd]);
  
  // --- NUEVA LÓGICA DE VALIDACIÓN ---
  const hasEnoughBalance = buyerBalance >= paymentAmountARS;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gamePriceUSD || !hasEnoughBalance) {
      toast.error("No tienes saldo suficiente para esta compra.");
      return;
    }
    if (gamePriceUSD > availableAmountUsd) {
      toast.error(`El costo del juego ($${gamePriceUSD.toFixed(2)} USD) supera el saldo disponible del vendedor.`);
      return;
    }
    
    setLoading(true);
    const supabase = createClient();

    // --- LLAMADA A LA NUEVA FUNCIÓN RPC ---
    const { data, error } = await supabase.rpc('create_purchase_with_credits', {
      p_listing_id: listing.id,
      p_game_url: gameUrl,
      p_game_price_ars: paymentAmountARS
    });

    if (error) {
      toast.error("Error al procesar la compra", { description: error.message });
      setLoading(false);
    } else {
      toast.success("¡Compra iniciada!", { description: "Revisa los detalles de la transacción en tu dashboard." });
      // Redirigir a la página de la transacción recién creada
      router.push(`/transaction/${data[0].id}`);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Iniciar Compra</h3>

      {/* Mostramos el saldo disponible del usuario */}
      <div className="flex items-center justify-end gap-2 text-sm text-gray-300 mb-2">
        <Wallet size={16} />
        <span>Tu Saldo:</span>
        <span className="font-bold text-white">{buyerBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-700 p-6 rounded-md space-y-4">
        <div>
          <Label htmlFor="game-url">Pega la URL del Juego de Steam aquí</Label>
          <Input id="game-url" type="url" placeholder="https://store.steampowered.com/app/..." value={gameUrl} onChange={(e) => handleUrlChange(e.target.value)} required className="bg-gray-800 border-gray-600"/>
        </div>
        
        {priceLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Buscando precio...</span>
          </div>
        )}

        {gamePriceUSD && (
          <div className="p-4 bg-gray-900/50 rounded-md space-y-3">
            <div className="flex justify-between text-lg">
              <span className="text-gray-300">Costo del Juego:</span>
              <span className="font-bold text-white">${gamePriceUSD.toFixed(2)} USD</span>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-between text-xl">
              <span className="font-semibold text-green-400">Costo Total en Créditos:</span>
              <span className="font-bold text-green-400">
                {paymentAmountARS.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </div>
          </div>
        )}
        
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {/* --- LÓGICA DE BOTÓN ACTUALIZADA --- */}
        {!hasEnoughBalance && gamePriceUSD ? (
          <div className="text-center p-4 bg-red-900/50 rounded-md">
            <p className="font-semibold text-red-400">No tienes saldo suficiente.</p>
            <Button asChild variant="link" className="text-sky-400">
              <Link href="/dashboard">Cargar Saldo desde el Dashboard</Link>
            </Button>
          </div>
        ) : (
          <Button type="submit" disabled={loading || priceLoading || !gamePriceUSD} className="w-full">
            {loading ? 'Procesando...' : 'Confirmar y Usar Créditos'}
          </Button>
        )}
      </form>
    </div>
  );
}