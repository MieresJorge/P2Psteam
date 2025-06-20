// src/app/dashboard/components/MyPurchases.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PayButton from './PayButton';
import ConfirmDeliveryButtons from './ConfirmDeliveryButtons';
import RatingForm from "./RatingForm";

const statusStyles: { [key: string]: { text: string; className: string } } = {
  pending_payment: { text: "Pendiente de Pago", className: "bg-yellow-500 hover:bg-yellow-600" },
  pending_delivery: { text: "Pendiente de Entrega", className: "bg-blue-500 hover:bg-blue-600" },
  pending_confirmation: { text: "Esperando tu Confirmación", className: "bg-sky-500 hover:bg-sky-600" },
  completed: { text: "Completada", className: "bg-green-500 hover:bg-green-600" },
  disputed: { text: "En Disputa", className: "bg-red-500 hover:bg-red-600" },
  cancelled: { text: "Cancelada", className: "bg-gray-500 hover:bg-gray-600" },
};

export default async function MyPurchases() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, reviews(id)')
    .eq('buyer_id', user.id)
    .not('status', 'in', '("cancelled")')
    .order('created_at', { ascending: false });

  if (error) {
    return <p className="text-red-500 mt-4">Error al cargar tus compras.</p>
  }

  // Separamos las compras activas de las completadas
  const activePurchases = transactions?.filter(tx => tx.status !== 'completed');
  const completedPurchases = transactions?.filter(tx => tx.status === 'completed');

  return (
    <div className="w-full">
      {/* SECCIÓN DE COMPRAS ACTIVAS */}
      {activePurchases && activePurchases.length > 0 && (
        <>
          <h2 className="text-3xl font-bold mb-6">Mis Compras Activas</h2>
          <div className="space-y-4">
            {activePurchases.map(tx => (
              <Card key={tx.id} className="bg-gray-800 border-gray-700 text-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="truncate max-w-md">Juego Solicitado</CardTitle>
                      <CardDescription className="text-sky-400 break-all">{tx.game_url}</CardDescription>
                    </div>
                    <Badge className={statusStyles[tx.status]?.className || 'bg-gray-500'}>
                      {statusStyles[tx.status]?.text || tx.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center pt-4">
                  <p className="text-xl font-bold">${tx.game_price_ars.toLocaleString('es-AR')} ARS</p>
                  <div className="min-w-[200px] flex justify-end">
                    {tx.status === 'pending_payment' && <PayButton transactionId={tx.id} />}
                    {tx.status === 'pending_delivery' && <p className="text-sm text-gray-400 italic">Esperando entrega...</p>}
                    {tx.status === 'pending_confirmation' && <ConfirmDeliveryButtons transactionId={tx.id} />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <hr className="my-12 border-gray-700"/>
        </>
      )}

      {/* SECCIÓN DE HISTORIAL DE COMPRAS (PARA CALIFICAR) */}
      {completedPurchases && completedPurchases.length > 0 && (
        <>
          <h2 className="text-3xl font-bold mb-6">Historial de Compras</h2>
           <div className="space-y-4">
            {completedPurchases.map(tx => (
              <Card key={tx.id} className="bg-gray-800/50 border-gray-700 text-white">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="truncate max-w-md text-gray-400">{tx.game_url}</CardTitle>
                    </div>
                    <Badge className={statusStyles[tx.status]?.className || 'bg-gray-500'}>
                      {statusStyles[tx.status]?.text || tx.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* AQUÍ ESTÁ EL CAMBIO: Usamos !tx.reviews en lugar de tx.reviews.length */}
                  {!tx.reviews || tx.reviews.length === 0 ? (
                    // Si la compra está completa Y no tiene reseña, mostramos el formulario
                    <RatingForm transaction={tx} buyer={user} />
                  ) : (
                    // Si ya tiene reseña, mostramos un agradecimiento
                    <p className="text-center text-green-400 font-semibold py-4">¡Gracias por dejar tu reseña!</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}