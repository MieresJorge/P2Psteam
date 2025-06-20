// src/app/dashboard/sales/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

export default async function PendingSalesPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth-ui');

    // 1. Buscamos las transacciones que el vendedor debe entregar.
    const { data: sales, error } = await supabase
        .from('transactions')
        .select('*') // Hacemos un select simple primero.
        .eq('seller_id', user.id)
        .eq('status', 'pending_delivery')
        .order('created_at', { ascending: true });

    if (error) {
        return (
            <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <p className="text-red-500">Error al cargar tus ventas: {error.message}</p>
                </div>
            </main>
        );
    }

    // 2. Si hay ventas, buscamos los perfiles de los compradores.
    let buyersMap = new Map<string, Profile>();
    if (sales && sales.length > 0) {
        const buyerIds = [...new Set(sales.map(s => s.buyer_id))];
        const { data: profilesData, error: rpcError } = await supabase
            .rpc('get_user_profiles_by_ids', { user_ids: buyerIds });

        if (rpcError) {
            console.error("Error fetching buyers profiles:", rpcError);
        } else if (profilesData) {
            const profiles = Array.isArray(profilesData) ? profilesData : [profilesData];
            buyersMap = new Map(profiles.map(p => [p.id, p]));
        }
    }

    return (
        <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard" className="text-sky-400 hover:underline mb-8 inline-flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Volver al Dashboard
                </Link>

                <div className="flex items-center gap-4 mb-6">
                    <PackageCheck className="h-8 w-8 text-yellow-400" />
                    <h1 className="text-3xl font-bold">Ventas Pendientes de Entrega</h1>
                </div>

                <div className="space-y-4">
                    {!sales || sales.length === 0 ? (
                        <Card className="bg-gray-800 border-gray-700 text-center p-8">
                            <p className="text-gray-400">¡Excelente! No tienes ninguna venta pendiente por entregar.</p>
                        </Card>
                    ) : (
                        sales.map(sale => {
                            const buyer = buyersMap.get(sale.buyer_id);
                            const buyerName = buyer?.name || 'Comprador';
                            const buyerAvatar = buyer?.avatar_url || '/default-avatar.png';

                            return (
                                <Link href={`/transaction/${sale.id}`} key={sale.id} className="block hover:bg-gray-800/50 rounded-lg transition-colors">
                                    <Card className="bg-transparent border-yellow-500 text-white">
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="truncate max-w-md">Regalar a:</CardTitle>
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <img src={buyerAvatar} alt={`Avatar de ${buyerName}`} width={24} height={24} className="rounded-full" />
                                                        <span className="font-semibold">{buyerName}</span>
                                                    </div>
                                                </div>
                                                <Badge className="bg-blue-500">Pendiente de Entrega</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="font-semibold">Juego Solicitado:</p>
                                            <a href={sale.game_url || '#'} target="_blank" rel="noopener noreferrer" className="text-sky-400 break-all hover:underline">{sale.game_url}</a>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}