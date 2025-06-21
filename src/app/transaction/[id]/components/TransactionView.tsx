// src/app/transaction/[id]/components/TransactionView.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import ActionButtons from './ActionButtons';
import { CheckCircle2 } from 'lucide-react';

// Tipos de datos que el componente recibirá como props
type Profile = {
  id: string;
  name: string;
  avatar_url: string;
}

type Step = {
  status: string;
  label: string;
  icon: JSX.Element;
}

type Transaction = {
  id: number;
  status: string;
  buyer_id: string;
  seller_id: string;
}

interface TransactionViewProps {
  transaction: Transaction;
  steps: Step[];
  isBuyer: boolean;
  isSeller: boolean;
  currentUser: User;
  sellerFriendCode: string | null;
  buyerProfile: Profile | undefined;
}

export default function TransactionView({
  transaction,
  steps,
  isBuyer,
  isSeller,
  currentUser,
  sellerFriendCode,
  buyerProfile,
}: TransactionViewProps) {
  const router = useRouter();

  // --- LÓGICA DE REALTIME CON BROADCAST ---
  useEffect(() => {
    const supabase = createClient();
    
    // El nombre del canal es único para cada transacción
    const channel = supabase.channel(`transaction-updates-${transaction.id}`);

    // Nos suscribimos para escuchar eventos de tipo 'broadcast'
    channel.on(
      'broadcast',
      { event: 'status-updated' }, // Solo nos interesan nuestros eventos personalizados
      (payload) => {
        console.log('Broadcast recibido!', payload);
        // Al recibir el aviso, refrescamos los datos de la página
        router.refresh();
      }
    ).subscribe();

    // Limpiamos la suscripción cuando el componente se desmonta
    return () => {
      supabase.removeChannel(channel);
    };
  }, [transaction.id, router]);
  // --- FIN DE LA LÓGICA DE REALTIME ---

  const currentStepIndex = steps.findIndex(step => step.status === transaction.status);
  
  const actionIsOnCurrentUser = 
    (isBuyer && ['pending_payment', 'pending_friend_request', 'pending_confirmation'].includes(transaction.status)) ||
    (isSeller && ['pending_friend_acceptance', 'pending_delivery'].includes(transaction.status));

  // El resto del JSX se mantiene exactamente igual
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-sky-400 hover:underline mb-6 inline-block">&larr; Volver al Dashboard</Link>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-2">Transacción #{transaction.id}</h1>
          <p className="text-gray-400 mb-8">Sigue los pasos para completar la operación de forma segura.</p>

          <div className="space-y-2">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture = index > currentStepIndex;

              return (
                <div key={step.status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center self-stretch">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted ? 'bg-green-500' : isCurrent ? 'bg-sky-500' : 'bg-gray-700'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={24} /> : step.icon}
                    </div>
                    {index < steps.length - 1 && <div className="w-0.5 flex-grow bg-gray-700 my-2"></div>}
                  </div>
                  <div className={`pt-1 pb-6 w-full ${isFuture ? 'opacity-40' : ''}`}>
                    <h3 className={`font-bold text-lg ${isCurrent ? 'text-sky-400' : 'text-white'}`}>{step.label}</h3>
                    <div className="text-sm text-gray-300">
                      {isCurrent && (
                        <div className={`p-4 mt-2 rounded-md border ${
                            transaction.status === 'completed' 
                              ? 'border-transparent'
                              : 'bg-gray-700/50 border-gray-700'
                          }`}>
                          
                          {transaction.status !== 'completed' && (
                            actionIsOnCurrentUser ? (
                              <p className="font-semibold mb-2 text-yellow-400">ACCIÓN REQUERIDA:</p>
                            ) : (
                              <p className="font-semibold mb-2 text-sky-400">ESPERANDO A LA OTRA PARTE:</p>
                            )
                          )}
                          
                           <ActionButtons 
                             transaction={transaction}
                             isBuyer={isBuyer}
                             isSeller={isSeller}
                             sellerFriendCode={sellerFriendCode}
                             buyerProfile={buyerProfile}
                           />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  );
}