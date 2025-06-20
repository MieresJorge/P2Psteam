// src/app/transaction/[id]/components/ActionButtons.tsx
'use client';

import MarkAsSentButton from "@/app/dashboard/components/MarkAsSentButton";
import ConfirmDeliveryButtons from "@/app/dashboard/components/ConfirmDeliveryButtons";
import PayButton from "@/app/dashboard/components/PayButton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link"; // 1. Importar Link

// Definimos la interfaz para los perfiles
interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

interface Transaction {
  id: number;
  status: string;
}
interface Props {
  transaction: Transaction;
  isBuyer: boolean;
  isSeller: boolean;
  sellerFriendCode?: string | null;
  buyerProfile?: Profile;
}

export default function ActionButtons({ transaction, isBuyer, isSeller, sellerFriendCode, buyerProfile }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      router.refresh();
    }
    setLoading(false);
  };

  switch (transaction.status) {
    // (Casos anteriores sin cambios)
    case 'pending_payment':
      if (isBuyer) return <PayButton transactionId={transaction.id} />;
      return <p className="text-gray-400 italic">Esperando pago del comprador...</p>;

    case 'pending_friend_request':
      if (isBuyer) {
        return (
          <div className="space-y-3">
            <p>Envía una solicitud de amistad en Steam al vendedor. Su código de amigo es:</p>
            <div className="bg-gray-900 p-2 rounded-md font-mono text-center text-lg">{sellerFriendCode || 'No especificado'}</div>
            <Button onClick={() => updateStatus('pending_friend_acceptance')} disabled={loading || !sellerFriendCode} className="w-full">
              {loading ? 'Actualizando...' : 'Ya envié la solicitud'}
            </Button>
          </div>
        );
      }
      return <p className="text-gray-400 italic">Esperando que el comprador te envíe la solicitud de amistad y lo confirme aquí...</p>;
    
    case 'pending_friend_acceptance':
      if (isSeller) {
        return (
          <div className="space-y-3 text-center">
            <p>Debes aceptar la solicitud de amistad en Steam de:</p>
            <div className="flex items-center gap-3 bg-gray-900 p-3 rounded-md justify-center">
              <img src={buyerProfile?.avatar_url || '/default-avatar.png'} alt={`Avatar de ${buyerProfile?.name}`} width={32} height={32} className="rounded-full" />
              <span className="font-bold text-lg">{buyerProfile?.name || 'Comprador Desconocido'}</span>
            </div>
            <Button onClick={() => updateStatus('pending_delivery')} disabled={loading} className="w-full">
              {loading ? 'Actualizando...' : 'Ya acepté la solicitud'}
            </Button>
          </div>
        );
      }
       return <p className="text-gray-400 italic">Esperando que el vendedor acepte tu solicitud de amistad...</p>;

    case 'pending_delivery':
      if (isSeller) return <MarkAsSentButton transactionId={transaction.id} />;
      return <p className="text-gray-400 italic">Esperando que el vendedor te envíe el regalo a través de Steam...</p>;

    case 'pending_confirmation':
      if (isBuyer) return <ConfirmDeliveryButtons transactionId={transaction.id} />;
      return <p className="text-gray-400 italic">Esperando que el comprador confirme la recepción del regalo...</p>;
    
    // 2. AÑADIMOS EL NUEVO CASO PARA 'COMPLETED'
    case 'completed':
      return (
        <div className="text-center space-y-2">
            <p className="text-green-400 font-semibold">¡Esta transacción ha finalizado con éxito!</p>
            {isBuyer && (
                <p className="text-sm text-gray-300">
                    Puedes calificar al vendedor desde tu{" "}
                    <Link href="/dashboard/history" className="font-bold text-sky-400 hover:underline">
                        Historial de Compras
                    </Link>.
                </p>
            )}
        </div>
      );

    default:
      return null;
  }
}