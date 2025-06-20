// src/app/transaction/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleDashed, Hourglass, Handshake, Gift, PackageCheck } from "lucide-react";
import ActionButtons from "./components/ActionButtons";
import Image from "next/image";

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

export default async function TransactionDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth-ui');
  }

  // 1. Buscamos la transacción.
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('*, listing:listing_id(sell_price_per_usd)')
    .eq('id', params.id)
    .single();

  if (txError || !transaction) {
    notFound();
  }

  const isBuyer = user.id === transaction.buyer_id;
  const isSeller = user.id === transaction.seller_id;

  if (!isBuyer && !isSeller) {
      notFound();
  }
  
  // 2. Buscamos los perfiles del comprador y vendedor con el método seguro.
  const { data: profilesData, error: profilesError } = await supabase
    .rpc('get_user_profiles_by_ids', { user_ids: [transaction.buyer_id, transaction.seller_id] });
  
  let buyerProfile: Profile | undefined;
  let sellerProfile: Profile | undefined;
  
  if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
  } else if (profilesData) {
      const profiles = Array.isArray(profilesData) ? profilesData : [profilesData];
      buyerProfile = profiles.find(p => p.id === transaction.buyer_id);
      sellerProfile = profiles.find(p => p.id === transaction.seller_id);
  }

  // 3. Buscamos por separado el código de amigo del vendedor desde la tabla 'profiles'
  const { data: sellerExtraProfile } = await supabase
    .from('profiles')
    .select('steam_friend_code')
    .eq('id', transaction.seller_id)
    .single();

  const sellerFriendCode = sellerExtraProfile?.steam_friend_code;
  
  // 4. Definimos los pasos del proceso
  const steps = [
    { status: 'pending_payment', label: 'Pago del Comprador', icon: <Hourglass size={20}/> },
    { status: 'pending_friend_request', label: 'Envío de Solicitud de Amistad', icon: <Handshake size={20}/> },
    { status: 'pending_friend_acceptance', label: 'Aceptación de Amistad', icon: <Handshake size={20}/> },
    { status: 'pending_delivery', label: 'Envío del Regalo', icon: <Gift size={20}/> },
    { status: 'pending_confirmation', label: 'Confirmación del Comprador', icon: <PackageCheck size={20}/> },
    { status: 'completed', label: 'Transacción Completada', icon: <CheckCircle2 size={20}/> },
  ];

  const currentStepIndex = steps.findIndex(step => step.status === transaction.status);
  
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
                        <div className="p-4 mt-2 bg-gray-700/50 rounded-md border border-gray-700">
                          <p className="font-semibold mb-2 text-yellow-400">ACCIÓN REQUERIDA:</p>
                           <ActionButtons 
                             transaction={transaction}
                             isBuyer={isBuyer}
                             isSeller={isSeller}
                             sellerFriendCode={sellerFriendCode}
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