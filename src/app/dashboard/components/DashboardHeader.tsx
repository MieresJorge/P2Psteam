// src/app/dashboard/components/DashboardHeader.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Settings, History, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CreateListingForm from "./CreateListingForm";
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Interfaces para los tipos de datos
interface SteamPlayer {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

interface Profile {
  mercado_pago_email: string | null;
}

interface Props {
  steamProfile: SteamPlayer | null;
  hasPendingReviews: boolean;
}


export default function DashboardHeader({ steamProfile, hasPendingReviews }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: fetchedProfile } = await supabase
          .from('profiles')
          .select('mercado_pago_email')
          .eq('id', user.id)
          .single();
        
        if (fetchedProfile) {
          setProfile(fetchedProfile);
        }
      }
    };
    fetchProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth-ui');
  };

  return (
    <header className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between">
      {/* Lado izquierdo: Perfil del usuario */}
      <div className="flex items-center gap-4">
        {steamProfile && (
          <a href={steamProfile.profileurl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
            <img // Usamos <img> normal para evitar problemas de configuración de hostname
              src={steamProfile.avatarfull}
              alt={steamProfile.personaname}
              width={40}
              height={40}
              className="rounded-full border-2 border-gray-600"
            />
            <span className="text-xl font-bold hover:underline">{steamProfile.personaname}</span>
          </a>
        )}
      </div>

      {/* Lado derecho: Todos los botones de acción */}
      <div className='flex items-center gap-3'>
        {/* Botón principal para Vender Saldo */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-sky-600 hover:bg-sky-700 font-semibold">
              <PlusCircle className="mr-2 h-5 w-5" />
              Vender Saldo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Crear Nueva Oferta</DialogTitle>
            </DialogHeader>
            <CreateListingForm onListingCreated={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Grupo de iconos de configuración, AHORA RESTAURADO */}
        <div className="flex items-center gap-1 border-l border-gray-700 pl-3">
          <Link href="/dashboard/history" className="relative">
            <Button variant="ghost" size="icon" title="Historial de Compras">
              <History className="h-5 w-5" />
            </Button>
            {hasPendingReviews && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-800" />
            )}
          </Link>
          
          <Link href="/dashboard/settings" className="relative">
            <Button variant="ghost" size="icon" title="Configuración de Perfil">
              <Settings className="h-5 w-5" />
            </Button>
            {(profile && !profile.mercado_pago_email) && (
              <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 w-3 h-3 bg-yellow-400 rounded-full border-2 border-gray-800" />
            )}
          </Link>

          <Button onClick={handleSignOut} variant="ghost" size="icon" title="Cerrar Sesión">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
