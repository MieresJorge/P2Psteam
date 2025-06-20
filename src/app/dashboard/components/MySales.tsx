// src/app/dashboard/components/MySales.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

// Interfaz para el perfil del comprador
interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

// Mapa de estilos para los estados de la transacción
const statusStyles: { [key: string]: { text: string; className: string } } = {
  pending_payment: { text: "Pendiente de Pago", className: "bg-yellow-500" },
  pending_friend_request: { text: "Esperando al Comprador", className: "bg-cyan-500" },
  pending_friend_acceptance: { text: "Acepta la Solicitud", className: "bg-blue-500" },
  pending_delivery: { text: "Acción Requerida: Entregar", className: "bg-yellow-400 text-black" },
  pending_confirmation: { text: "Esperando Confirmación", className: "bg-sky-500" },
  disputed: { text: "En Disputa", className: "bg-red-500" },
};

export default async function MySales() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // --- CAMBIO CLAVE: Buscamos todas las ventas que NO estén completadas o canceladas ---
  const { data: sales, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('seller_id', user.id)
    .not('status', 'in', '("completed", "cancelled")') // La condición clave es esta
    .order('created_at', { ascending: true });

  if (error) {
    return <p className="text-red-500 mt-4">Error al cargar tus ventas.</p>
  }

  if (!sales || sales.length === 0) {
    // Si no hay ventas activas, no mostramos nada.
    return null;
  }
  
  // Obtenemos los perfiles de los compradores
  const buyerIds = [...new Set(sales.map(s => s.buyer_id))];
  const { data: profilesData, error: profilesError } = await supabase
    .rpc('get_user_profiles_by_ids', { user_ids: buyerIds });

  if (profilesError) {
    console.error("Error al buscar perfiles de compradores:", profilesError);
  }

  let profiles: Profile[] = [];
  if (profilesData) {
    profiles = Array.isArray(profilesData) ? profilesData : [profilesData];
  }
  
  const buyersMap = new Map(profiles.map(p => [p.id, p]));

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-6 text-white">Mis Ventas Activas</h2>
      <div className="space-y-4">
        {sales.map(sale => {
          const buyer = buyersMap.get(sale.buyer_id);
          const buyerName = buyer?.name || 'Comprador';
          const buyerAvatar = buyer?.avatar_url || '/default-avatar.png';
          const statusInfo = statusStyles[sale.status] || { text: sale.status, className: 'bg-gray-500' };

          return (
            <Link href={`/transaction/${sale.id}`} key={sale.id} className="block hover:bg-gray-800/50 rounded-lg transition-colors duration-200">
                <Card className="bg-transparent border-gray-700 hover:border-sky-500 transition-colors duration-200">
                <CardHeader>
                    <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="truncate max-w-md">Venta a:</CardTitle>
                        <div className="flex items-center gap-2 pt-2">
                        <img src={buyerAvatar} alt={`Avatar de ${buyerName}`} width={24} height={24} className="rounded-full" />
                        <span className="font-semibold">{buyerName}</span>
                        </div>
                    </div>
                    <Badge className={statusInfo.className}>{statusInfo.text}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold">Juego Solicitado:</p>
                    <p className="text-sky-400 break-all">{sale.game_url}</p>
                    <p className="text-lg font-bold mt-2">
                    Precio: {sale.game_price_ars.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </p>
                </CardContent>
                </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}