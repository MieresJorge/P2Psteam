// src/app/dashboard/components/CreateListingForm.tsx
'use client';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const COMMISSION_RATE = 0.06;

export default function CreateListingForm({ onListingCreated }: { onListingCreated: () => void; }) {
  const router = useRouter();
  const [usdAmount, setUsdAmount] = useState('');
  const [sellPricePerUsd, setSellPricePerUsd] = useState('');
  const [loading, setLoading] = useState(false);
  
  // La lógica para la API del dólar y los cálculos se mantienen para dar feedback al usuario
  const [marketRatePerUsd, setMarketRatePerUsd] = useState<number | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    const fetchDolarRate = async () => {
      try {
        setApiLoading(true);
        const response = await fetch('https://dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        const IVA_RATE = 0.21;
        if (data.venta) {
          setMarketRatePerUsd(data.venta * (1 + IVA_RATE));
        } else { setMarketRatePerUsd(1427.80); }
      } catch (error) {
        setMarketRatePerUsd(1427.80);
      } finally {
        setApiLoading(false);
      }
    };
    fetchDolarRate();
  }, []);

  const { totalToReceive, commission } = useMemo(() => {
    const numUsdAmount = parseFloat(usdAmount);
    const numSellPricePerUsd = parseFloat(sellPricePerUsd);
    if (isNaN(numUsdAmount) || isNaN(numSellPricePerUsd)) {
      return { totalToReceive: 0, commission: 0 };
    }
    const total = numUsdAmount * numSellPricePerUsd;
    const comm = total * COMMISSION_RATE;
    return { totalToReceive: total, commission: comm };
  }, [usdAmount, sellPricePerUsd]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Error de autenticación.");
      setLoading(false);
      return;
    }

    // --- LÓGICA DE GUARDADO ACTUALIZADA ---
    const { error } = await supabase.from('listings').insert({
      seller_id: user.id,
      usd_amount: Number(usdAmount), // Guardamos el monto en USD directamente
      sell_price_per_usd: Number(sellPricePerUsd), // Guardamos el precio por USD
      // Los campos `amount_ars` y `discount_percentage` ya no existen
    });
    // --- FIN DE LA LÓGICA ACTUALIZADA ---

    if (error) {
      toast.error("Error al publicar la oferta", { description: error.message });
      setLoading(false);
    } else {
      toast.success("¡Oferta publicada con éxito!");
      router.refresh();
      onListingCreated();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {/* El formulario visualmente no cambia, pero ahora guarda los datos correctos */}
      <div className="space-y-2">
        <Label htmlFor="usd-amount">Monto en USD disponible en billetera Steam</Label>
        <Input id="usd-amount" type="number" step="0.01" placeholder="Ej: 20.00" value={usdAmount} onChange={(e) => setUsdAmount(e.target.value)} required className="bg-gray-900 border-gray-600"/>
      </div>
      <div className="space-y-2">
        <Label htmlFor="sell-price">Monto en pesos que vas a vender cada USD</Label>
        <Input id="sell-price" type="number" step="0.01" placeholder="Ej: 1150.00" value={sellPricePerUsd} onChange={(e) => setSellPricePerUsd(e.target.value)} required className="bg-gray-900 border-gray-600"/>
      </div>
      <hr className="border-gray-600" />
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center text-gray-400">
          <span>Monto en pesos por cada USD de Steam (ref.)</span>
          {apiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-mono">{formatCurrency(marketRatePerUsd || 0)}</span>}
        </div>
        <div className="flex justify-between items-center"><span className="font-semibold">Monto estimado a recibir (bruto)</span><span className="font-semibold font-mono">{formatCurrency(totalToReceive)}</span></div>
        <div className="flex justify-between items-center text-red-400"><span>Comisión a descontar ({COMMISSION_RATE * 100}%)</span><span className="font-mono">-{formatCurrency(commission)}</span></div>
      </div>
      <hr className="border-gray-600" />
      <div className="flex justify-between items-center text-lg text-green-400 font-bold"><span>Tú Recibes (Neto):</span><span className="font-mono">{formatCurrency(totalToReceive - commission)}</span></div>
      <Button type="submit" className="w-full font-semibold" disabled={loading || totalToReceive <= 0 || apiLoading}>{loading ? 'Publicando...' : 'Publicar Oferta'}</Button>
    </form>
  );
}
