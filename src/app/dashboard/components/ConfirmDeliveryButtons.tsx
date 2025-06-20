// src/app/dashboard/components/ConfirmDeliveryButtons.tsx
'use client';

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ConfirmDeliveryButtons({ transactionId }: { transactionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Función para marcar la transacción como COMPLETADA
  const handleConfirm = async () => {
    if (!confirm("Al confirmar, los fondos se liberarán al vendedor. ¿Estás seguro de que recibiste el producto correctamente?")) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);
    
    if (error) {
      alert("Error al completar la transacción: " + error.message);
    } else {
      alert("¡Transacción completada con éxito! Gracias por tu compra.");
      router.refresh();
    }
    setLoading(false);
  };

  // Función para marcar la transacción como EN DISPUTA
  const handleDispute = async () => {
    if (!confirm("¿Estás seguro de que quieres iniciar una disputa? Nos pondremos en contacto para mediar en la situación.")) {
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'disputed' })
      .eq('id', transactionId);

    if (error) {
      alert("Error al iniciar la disputa: " + error.message);
    } else {
      alert("Disputa iniciada. El equipo de soporte se pondrá en contacto contigo pronto.");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleDispute} disabled={loading} variant="destructive" size="sm">
        Tengo un Problema
      </Button>
      <Button onClick={handleConfirm} disabled={loading} variant="secondary" className="bg-green-600 hover:bg-green-700">
        Recibí el Juego Correctamente
      </Button>
    </div>
  );
}