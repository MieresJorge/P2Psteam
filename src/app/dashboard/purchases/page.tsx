// src/app/dashboard/purchases/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Reutilizamos el mapa de estilos que ya teníamos
const statusStyles: { [key: string]: { text: string; className: string } } = {
  pending_payment: { text: "Pendiente de Pago", className: "bg-yellow-500" },
  pending_delivery: { text: "Pendiente de Entrega", className: "bg-blue-500" },
  pending_confirmation: { text: "Esperando Confirmación", className: "bg-sky-500" },
  disputed: { text: "En Disputa", className: "bg-red-500" },
};

export default async function ActivePurchasesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth-ui');

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('id, game_url, game_price_ars, status')
        .eq('buyer_id', user.id)
        .not('status', 'in', '("completed", "cancelled")')
        .order('created_at', { ascending: false });

    return (
        <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard" className="text-sky-400 hover:underline mb-8 inline-flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Volver al Dashboard
                </Link>

                <div className="flex items-center gap-4 mb-6">
                    <ShoppingCart className="h-8 w-8 text-sky-400" />
                    <h1 className="text-3xl font-bold">Mis Compras Activas</h1>
                </div>

                <div className="space-y-4">
                    {error && <p className="text-red-500">Error al cargar tus compras.</p>}
                    {!transactions || transactions.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700 text-center p-8">
                            <p className="text-gray-400">¡Felicidades! No tienes ninguna compra activa en este momento.</p>
                        </Card>
                    ) : (
                        transactions.map(tx => (
                            <Link href={`/transaction/${tx.id}`} key={tx.id} className="block hover:bg-gray-800/50 rounded-lg transition-colors">
                                <Card className="bg-transparent border-gray-700 text-white">
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
                                    <CardContent>
                                        <p className="text-xl font-bold">
                                            ${tx.game_price_ars.toLocaleString('es-AR')} ARS
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
}
