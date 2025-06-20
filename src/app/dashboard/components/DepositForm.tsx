// src/app/dashboard/components/DepositForm.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function DepositForm() {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error("Por favor, ingresa un monto válido.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/deposits/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNumber }),
      });

      const data = await response.json();

      if (data.init_point) {
        // Si todo salió bien, redirigimos al usuario al checkout de Mercado Pago
        window.location.href = data.init_point;
      } else {
        toast.error('Error al iniciar el depósito', {
          description: data.error || 'No se pudo crear la preferencia de pago.',
        });
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado.');
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleDeposit} className="space-y-6 pt-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Monto a Cargar (ARS)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="Ej: 5000.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="bg-gray-900 border-gray-600"
        />
        <p className="text-xs text-gray-400">
          El monto ingresado se acreditará en tu cuenta como créditos. 1 Crédito = 1 ARS.
        </p>
      </div>
      <Button type="submit" disabled={loading} className="w-full font-semibold">
        {loading ? <Loader2 className="animate-spin" /> : 'Continuar a Mercado Pago'}
      </Button>
    </form>
  );
}