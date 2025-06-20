// src/app/transaction/[id]/components/ActionButtons.tsx
'use client';

import MarkAsSentButton from "@/app/dashboard/components/MarkAsSentButton";
import ConfirmDeliveryButtons from "@/app/dashboard/components/ConfirmDeliveryButtons";
import PayButton from "@/app/dashboard/components/PayButton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Definimos los tipos de datos que el componente recibirá
interface Transaction {
  id: number;
  status: string;
}
interface Props {
  transaction: Transaction;
  isBuyer: boolean;
  isSeller: boolean;
  sellerFriendCode?: string | null;
}

export default function ActionButtons({ transaction, isBuyer, isSeller, sellerFriendCode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Función genérica para actualizar el estado
  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transaction.id);
    
    if (error) {
      alert("Error al actualizar la transacción: " + error.message);
    } else {
      router.refresh(); // Recargamos la página para ver el siguiente paso
    }
    setLoading(false);
  };

  // Lógica para decidir qué mostrar
  switch (transaction.status) {
    case 'pending_payment':
      if (isBuyer) {
        return <PayButton transactionId={transaction.id} />;
      }
      return <p className="text-gray-400 italic">Esperando pago del comprador...</p>;

    case 'pending_friend_request':
      if (isBuyer) {
        return (
          <div className="space-y-3">
            <p>El vendedor te debe aceptar como amigo en Steam. Su código de amigo es:</p>
            <div className="bg-gray-900 p-2 rounded-md font-mono text-center text-lg">{sellerFriendCode || 'No especificado'}</div>
            <Button onClick={() => updateStatus('pending_friend_acceptance')} disabled={loading || !sellerFriendCode} className="w-full">
              {loading ? 'Actualizando...' : 'Ya envié la solicitud'}
            </Button>
          </div>
        );
      }
      return <p className="text-gray-400 italic">Esperando que el comprador te envíe solicitud de amistad...</p>;
    
    case 'pending_friend_acceptance':
      if (isSeller) {
        return (
          <Button onClick={() => updateStatus('pending_delivery')} disabled={loading} className="w-full">
            {loading ? 'Actualizando...' : 'Ya acepté la solicitud de amistad'}
          </Button>
        );
      }
       return <p className="text-gray-400 italic">Esperando que el vendedor acepte tu solicitud...</p>;

    case 'pending_delivery':
      if (isSeller) {
        return <MarkAsSentButton transactionId={transaction.id} />;
      }
      return <p className="text-gray-400 italic">Esperando que el vendedor envíe el regalo...</p>;

    case 'pending_confirmation':
      if (isBuyer) {
        return <ConfirmDeliveryButtons transactionId={transaction.id} />;
      }
      return <p className="text-gray-400 italic">Esperando que el comprador confirme la recepción...</p>;

    default:
      return null;
  }
}
