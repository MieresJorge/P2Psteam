// src/app/dashboard/components/MySales.tsx
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MarkAsSentButton from "./MarkAsSentButton";
import Image from "next/image";

// Interfaz para el perfil del comprador
interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

export default async function MySales() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Buscamos las transacciones donde el usuario actual es el VENDEDOR
  // y el estado es 'pendiente de entrega'.
  const { data: sales, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('seller_id', user.id)
    .eq('status', 'pending_delivery')
    .order('created_at', { ascending: true });

  if (error) {
    return <p className="text-red-500 mt-4">Error al cargar tus ventas.</p>
  }

  if (!sales || sales.length === 0) {
    // Es normal no tener ventas pendientes, así que no mostramos nada.
    return null;
  }
  
  // Obtenemos los perfiles de los compradores
  const buyerIds = [...new Set(sales.map(s => s.buyer_id))];
  
  // Llamamos al RPC sin un tipo estricto, para normalizarlo después
  const { data: profilesData, error: profilesError } = await supabase
    .rpc('get_user_profiles_by_ids', { user_ids: buyerIds });

  if (profilesError) {
    console.error("Error al buscar perfiles de compradores:", profilesError);
    // Podemos decidir mostrar un error o continuar sin los datos del perfil
  }

  // LA SOLUCIÓN: NORMALIZACIÓN DE DATOS
  let profiles: Profile[] = [];
  if (profilesData) {
    profiles = Array.isArray(profilesData) ? profilesData : [profilesData];
  }
  // ------------------------------------

  const buyersMap = new Map(profiles.map(p => [p.id, p]));

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-6 text-yellow-400">Acción Requerida: Mis Ventas Pendientes</h2>
      <div className="space-y-4">
        {sales.map(sale => {
          const buyer = buyersMap.get(sale.buyer_id);
          const buyerName = buyer?.name || 'Comprador';
          const buyerAvatar = buyer?.avatar_url || '/default-avatar.png';

          return (
            <Card key={sale.id} className="bg-gray-800 border-yellow-500 text-white">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="truncate max-w-md">Regalar a:</CardTitle>
                    <div className="flex items-center gap-2 pt-2">
                      <Image src={buyerAvatar} alt={`Avatar de ${buyerName}`} width={24} height={24} className="rounded-full" />
                      <span className="font-semibold">{buyerName}</span>
                    </div>
                  </div>
                  <Badge className="bg-blue-500">Pendiente de Entrega</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">Juego Solicitado:</p>
                <a href={sale.game_url || '#'} target="_blank" rel="noopener noreferrer" className="text-sky-400 break-all hover:underline">{sale.game_url}</a>
                <p className="text-lg font-bold mt-2">
                  Precio: ${sale.game_price_ars.toLocaleString('es-AR')} ARS
                </p>
                <MarkAsSentButton transactionId={sale.id} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}