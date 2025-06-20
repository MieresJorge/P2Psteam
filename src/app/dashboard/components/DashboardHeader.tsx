// src/app/dashboard/components/DashboardHeader.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Settings, History, PlusCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import CreateListingForm from "./CreateListingForm";
import DepositForm from './DepositForm';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Interfaces
interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}
interface Profile {
  mercado_pago_email: string | null;
  steam_friend_code: string | null; // Añadimos el nuevo campo
}
interface Props {
  steamProfile: SteamPlayer | null;
  hasPendingReviews: boolean;
}


export default function DashboardHeader({ steamProfile, hasPendingReviews }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null); // Ahora el perfil tendrá ambos campos
  const [isListingDialogOpen, setIsListingDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtenemos ambos campos del perfil
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('mercado_pago_email, steam_friend_code')
          .eq('id', user.id)
          .single();
        
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  // (El useEffect para el regreso de Mercado Pago no cambia)
  useEffect(() => {
    const depositStatus = searchParams.get('deposit_status');
    if (depositStatus === 'success') {
      toast.success("¡Pago exitoso!", { description: "Tu saldo se está actualizando..." });
      const timer = setTimeout(() => router.refresh(), 3000); 
      return () => clearTimeout(timer);
    }
    if (depositStatus === 'failure') {
        toast.error("El pago falló", { description: "Por favor, intenta nuevamente." });
    }
  }, [searchParams, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth-ui');
  };

  // Variable que determina si el perfil está completo para vender
  const isProfileCompleteForSelling = !!profile?.mercado_pago_email && !!profile?.steam_friend_code;

  return (
    <header className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between">
      {/* ... (perfil de usuario y diálogo de depósito sin cambios) ... */}
      <div className="flex items-center gap-4">
        {steamProfile && (
          <a href={steamProfile.profileurl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <img src={steamProfile.avatarfull} alt={steamProfile.personaname} width={40} height={40} className="rounded-full border-2 border-gray-600"/>
            <span className="text-xl font-bold hover:underline">{steamProfile.personaname}</span>
          </a>
        )}
      </div>
      <div className='flex items-center gap-3'>
        <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 font-semibold"><Wallet className="mr-2 h-5 w-5" />Cargar Saldo</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
            <DialogHeader><DialogTitle>Cargar créditos en tu cuenta</DialogTitle></DialogHeader>
            <DepositForm />
          </DialogContent>
        </Dialog>

        {/* --- LÓGICA DE OBLIGATORIEDAD PARA VENDER --- */}
        <Dialog open={isListingDialogOpen} onOpenChange={setIsListingDialogOpen}>
          <DialogTrigger asChild>
            {/* El botón se deshabilita si el perfil no está completo */}
            <Button className="bg-sky-600 hover:bg-sky-700 font-semibold" disabled={!isProfileCompleteForSelling}>
              <PlusCircle className="mr-2 h-5 w-5" />
              Vender Saldo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Crear Nueva Oferta</DialogTitle>
              {!isProfileCompleteForSelling && (
                <DialogDescription className="!text-yellow-400 pt-2">
                  Debes configurar tu email de Mercado Pago y tu código de amigo de Steam en <Link href="/dashboard/settings" className="font-bold underline">Configuración</Link> para poder vender.
                </DialogDescription>
              )}
            </DialogHeader>
            {/* Solo mostramos el formulario si el perfil está completo */}
            {isProfileCompleteForSelling && <CreateListingForm onListingCreated={() => setIsListingDialogOpen(false)} />}
          </DialogContent>
        </Dialog>

        {/* Grupo de iconos de configuración */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
          <Link href="/dashboard/history" className="relative">
            <Button variant="ghost" size="icon" title="Historial de Compras"><History className="h-5 w-5" /></Button>
            {hasPendingReviews && (<span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-800" />)}
          </Link>
          <Link href="/dashboard/settings" className="relative">
            <Button variant="ghost" size="icon" title="Configuración de Perfil"><Settings className="h-5 w-5" /></Button>
            {/* Notificación si falta algún dato */}
            {!isProfileCompleteForSelling && (<span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-800" />)}
          </Link>
          <Button onClick={handleSignOut} variant="ghost" size="icon" title="Cerrar Sesión"><LogOut className="h-5 w-5" /></Button>
        </div>
      </div>
    </header>
  );
}