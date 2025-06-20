// src/app/dashboard/components/PayButton.tsx
'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PayButton({ transactionId }: { transactionId: number }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Si todo salió bien, redirigimos al usuario al checkout de Mercado Pago
        window.location.href = data.init_point;
      } else {
        alert('Error: ' + (data.error || 'No se pudo iniciar el pago.'));
      }
    } catch (error) {
      alert('Ocurrió un error inesperado.');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <Button onClick={handlePayment} disabled={loading}>
      {loading ? 'Procesando...' : 'Pagar ahora con Mercado Pago'}
    </Button>
  );
}