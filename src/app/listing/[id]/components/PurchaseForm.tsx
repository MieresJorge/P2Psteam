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
import { Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estados para los precios detectados
  const [detectedGamePriceArs, setDetectedGamePriceArs] = useState<number | null>(null);

  const handleUrlChange = async (url: string) => {
    setGameUrl(url);
    setErrorMsg('');
    setDetectedGamePriceArs(null);
    
    // Extraemos el ID de la App de la URL de Steam con una expresión regular
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
        if (data.price) {
          setDetectedGamePriceArs(data.price);
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
  
  // Calculamos el costo en USD basado en el precio detectado en ARS
  const requiredUsd = useMemo(() => {
    if (!detectedGamePriceArs) return 0;
    return detectedGamePriceArs / listing.sell_price_per_usd;
  }, [detectedGamePriceArs, listing.sell_price_per_usd]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detectedGamePriceArs) {
      setErrorMsg("Por favor, introduce una URL de juego válida para detectar el precio.");
      return;
    }
    if (requiredUsd > availableAmountUsd) {
      setErrorMsg(`El costo del juego ($${requiredUsd.toFixed(2)} USD) supera el saldo disponible del vendedor.`);
      return;
    }
    
    setLoading(true);
    // ... La lógica de handleSubmit para crear la transacción se queda igual
    // ... usando 'detectedGamePriceArs' como 'game_price_ars'
  };

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Iniciar Compra</h3>
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

        {detectedGamePriceArs && (
          <div className="p-3 bg-gray-900/50 rounded-md space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Precio del Juego:</span>
              <span className="font-bold">{detectedGamePriceArs.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Costo en Saldo del Vendedor:</span>
              <span className="font-bold">${requiredUsd.toFixed(2)} USD</span>
            </div>
          </div>
        )}

        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        <Button type="submit" disabled={loading || priceLoading || !detectedGamePriceArs} className="w-full">
          {loading ? 'Procesando...' : 'Solicitar Compra'}
        </Button>
      </form>
    </div>
  );
}