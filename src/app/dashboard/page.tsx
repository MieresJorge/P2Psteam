// src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardHeader from "./components/DashboardHeader";
import ListingsDisplay from "./components/ListingsDisplay";
import MySales from "./components/MySales";
import StatCard from "./components/StatCard";
import { DollarSign, ShoppingCart, PackageCheck } from "lucide-react";
import SteamConnectButton from "./components/SteamConnectButton";

export const dynamic = 'force-dynamic';

interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) { redirect('/auth-ui'); }

  const steamId = user.user_metadata?.steam_id;
  if (!steamId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="p-8 text-center bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold">Último Paso Requerido</h2>
          <p className="text-gray-400 mt-2 mb-6">Por favor, conecta tu cuenta de Steam para continuar.</p>
          <SteamConnectButton />
        </div>
      </div>
    );
  }

  // --- Lógica para notificaciones y estadísticas ---
  const { data: pendingReviewsData } = await supabase.from('transactions').select('reviews(id)').eq('buyer_id', user.id).eq('status', 'completed');
  const hasPendingReviews = pendingReviewsData ? pendingReviewsData.some(tx => !tx.reviews || tx.reviews.length === 0) : false;
  const { data: salesData } = await supabase.from('transactions').select('id, status').eq('seller_id', user.id);
  const { data: purchasesData } = await supabase.from('transactions').select('id, status').eq('buyer_id', user.id);
  const pendingSalesCount = salesData?.filter(s => s.status === 'pending_delivery').length || 0;
  const activePurchasesCount = purchasesData?.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length || 0;
  
  // --- NUEVA LÓGICA: OBTENER SALDO DISPONIBLE DEL PERFIL ---
  const { data: profileData } = await supabase
    .from('profiles')
    .select('available_balance_ars')
    .eq('id', user.id)
    .single();
  const availableBalance = profileData?.available_balance_ars || 0;
  
  // --- Lógica para obtener el perfil de Steam (se queda igual) ---
  let steamProfile: SteamPlayer | null = null;
  try {
    const apiKey = process.env.STEAM_API_KEY;
    const response = await fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamId}`);
    const data = await response.json();
    if (data.response.players.length > 0) {
      const player = data.response.players[0];
      steamProfile = {
        steamid: player.steamid,
        personaname: player.personaname,
        avatarfull: player.avatarfull,
        profileurl: player.profileurl,
      };
    }
  } catch (error) {
    console.error("Error al obtener datos de Steam:", error);
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader steamProfile={steamProfile} hasPendingReviews={hasPendingReviews} />
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Ventas Pendientes de Entrega" value={pendingSalesCount} icon={PackageCheck} href="/dashboard/sales" />
          <StatCard title="Compras Activas" value={activePurchasesCount} icon={ShoppingCart} href="/dashboard/purchases" />
          {/* AHORA MOSTRAMOS EL SALDO REAL DE LA BILLETERA */}
          <StatCard 
            title="Saldo a Retirar" 
            value={availableBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} 
            icon={DollarSign} 
          />
        </div>
        <div className="grid grid-cols-1">
          <div>
            <h2 className="text-3xl font-bold mb-6">Mercado de Saldos</h2>
            <ListingsDisplay />
          </div>
        </div>
      </div>
    </main>
  );
}