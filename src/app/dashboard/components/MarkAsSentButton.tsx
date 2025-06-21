// src/app/dashboard/components/MarkAsSentButton.tsx
'use client';

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner"; // Usaremos toasts para notificaciones

export default function MarkAsSentButton({ transactionId }: { transactionId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMarkAsSent = async () => {
    if (!confirm("¿Estás seguro de que ya has enviado el regalo? Esta acción no se puede deshacer.")) {
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Actualizamos el estado de la transacción a 'pending_confirmation'
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'pending_confirmation' })
      .eq('id', transactionId);

    if (error) {
      toast.error("Error al actualizar el estado", { description: error.message });
    } else {
      // --- CAMBIO CLAVE: Enviamos el aviso por Broadcast ---
      const channel = supabase.channel(`transaction-updates-${transactionId}`);
      await channel.send({
        type: 'broadcast',
        event: 'status-updated',
        payload: { newStatus: 'pending_confirmation' },
      });
      // ---------------------------------------------------
      
      toast.success("¡Venta marcada como enviada!", { description: "Esperando la confirmación del comprador." });
      router.refresh(); // Refrescamos la vista del usuario actual
    }

    setLoading(false);
  };

  return (
    <Button onClick={handleMarkAsSent} disabled={loading} className="w-full mt-4 bg-sky-600 hover:bg-sky-700">
      {loading ? 'Actualizando...' : 'Ya envié el regalo'}
    </Button>
  );
}