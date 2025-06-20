// src/app/dashboard/components/ConfirmDeliveryButtons.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ConfirmDeliveryButtons({ transactionId }: { transactionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDisputeLoading, setIsDisputeLoading] = useState(false);

  // --- FUNCIÓN handleConfirm CORREGIDA ---
  const handleConfirm = async () => {
    if (!confirm("Al confirmar, los fondos se liberarán al vendedor. ¿Estás seguro de que recibiste el producto correctamente? Esta acción no se puede deshacer.")) {
      return;
    }
    setLoading(true);

    try {
      // Ahora llamamos a nuestra API de backend para que haga todo el trabajo.
      const response = await fetch('/api/payouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error en el servidor.');
      }

      toast.success("¡Transacción completada!", { description: "El pago ha sido acreditado al vendedor." });
      router.refresh();

    } catch (error: any) {
      toast.error("Error al completar la transacción", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!confirm("¿Estás seguro de que quieres iniciar una disputa? Nos pondremos en contacto para mediar en la situación.")) {
      return;
    }
    setIsDisputeLoading(true);
    // Lógica para la disputa
    // ...
    toast.info("Disputa iniciada. El equipo de soporte se pondrá en contacto contigo pronto.");
    setIsDisputeLoading(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleDispute} disabled={loading || isDisputeLoading} variant="destructive" size="sm">
        Tengo un Problema
      </Button>
      <Button onClick={handleConfirm} disabled={loading || isDisputeLoading} className="bg-green-600 hover:bg-green-700">
        {loading ? 'Procesando Pago...' : 'Recibí el Juego Correctamente'}
      </Button>
    </div>
  );
}