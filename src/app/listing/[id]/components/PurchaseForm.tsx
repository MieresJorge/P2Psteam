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

// Actualizamos las props que el componente recibe
interface Listing {
  id: number;
  seller_id: string;
  sell_price_per_usd: number;
}
interface PurchaseFormProps {
  listing: Listing;
  buyer: User;
  availableAmountUsd: number;
}

export default function PurchaseForm({ listing, buyer, availableAmountUsd }: PurchaseFormProps) {
  const router = useRouter();
  const [gameUrl, setGameUrl] = useState('');
  const [usdToBuy, setUsdToBuy] = useState(''); // Ahora pedimos USD
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- CÁLCULO EN TIEMPO REAL PARA EL COMPRADOR ---
  const finalArsPrice = useMemo(() => {
    const numUsdToBuy = parseFloat(usdToBuy);
    if (isNaN(numUsdToBuy) || numUsdToBuy <= 0) return 0;
    return numUsdToBuy * listing.sell_price_per_usd;
  }, [usdToBuy, listing.sell_price_per_usd]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const numUsdToBuy = parseFloat(usdToBuy);

    // Validación contra el saldo disponible en USD
    if (numUsdToBuy > availableAmountUsd) {
      setErrorMsg(`El monto solicitado no puede superar el saldo disponible del vendedor ($${availableAmountUsd.toFixed(2)} USD).`);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const commission = finalArsPrice * 0.06;
    const payout = finalArsPrice - commission;

    const { data: newTransaction, error } = await supabase
      .from('transactions')
      .insert({
        listing_id: listing.id,
        buyer_id: buyer.id,
        seller_id: listing.seller_id,
        game_url: gameUrl,
        game_price_ars: finalArsPrice, // Guardamos el precio final en ARS
        commission_ars: commission,
        payout_amount_ars: payout,
      })
      .select('id')
      .single();

    setLoading(false);

    if (error) {
      toast.error("Error al crear la solicitud", { description: error.message });
    } else {
      toast.success("¡Solicitud de compra creada! Serás redirigido para completar el pago.");
      router.push(`/transaction/${newTransaction.id}`);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Iniciar Compra</h3>
      <form onSubmit={handleSubmit} className="bg-gray-700 p-6 rounded-md space-y-4">
        <div>
          <Label htmlFor="game-url">URL del Juego en Steam</Label>
          <Input id="game-url" type="url" placeholder="https://store.steampowered.com/app/..." value={gameUrl} onChange={(e) => setGameUrl(e.target.value)} required className="bg-gray-800 border-gray-600"/>
        </div>
        <div>
          <Label htmlFor="usd-to-buy">Monto en USD a Comprar</Label>
          <Input id="usd-to-buy" type="number" step="0.01" placeholder="Ej: 9.99" value={usdToBuy} onChange={(e) => setUsdToBuy(e.target.value)} required className="bg-gray-800 border-gray-600"/>
        </div>
        
        {/* Mostramos el precio final calculado en ARS */}
        {finalArsPrice > 0 && (
          <div className="p-3 bg-gray-900/50 rounded-md text-center">
            <span className="text-gray-400">Total a pagar:</span>{' '}
            <span className="font-bold text-xl text-white">{formatCurrency(finalArsPrice)}</span>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        <Button type="submit" disabled={loading || finalArsPrice <= 0} className="w-full">
          {loading ? 'Procesando...' : 'Solicitar Compra'}
        </Button>
      </form>
    </div>
  );
}
