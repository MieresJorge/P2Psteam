// src/app/dashboard/components/MarkAsSentButton.tsx
'use client';

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkAsSentButton({ transactionId }: { transactionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkAsSent = async () => {
    if (!confirm("¿Estás seguro de que ya has enviado el regalo? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'pending_confirmation' })
      .eq('id', transactionId);

    setLoading(false);

    if (error) {
      alert("Error al actualizar el estado: " + error.message);
    } else {
      alert("¡Venta marcada como enviada! Esperando la confirmación del comprador.");
      router.refresh(); // Refrescamos la página para que la venta desaparezca de esta lista.
    }
  };

  return (
    <Button onClick={handleMarkAsSent} disabled={loading} className="w-full mt-4 bg-sky-600 hover:bg-sky-700">
      {loading ? 'Actualizando...' : 'Ya envié el regalo'}
    </Button>
  );
}