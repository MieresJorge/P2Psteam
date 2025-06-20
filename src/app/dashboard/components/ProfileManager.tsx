// src/app/dashboard/components/ProfileManager.tsx
'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Usaremos toasts para notificaciones

export default function ProfileManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [mpEmail, setMpEmail] = useState<string | null>(null);
  const [steamFriendCode, setSteamFriendCode] = useState<string | null>(null); // 1. Nuevo estado para el código de amigo

  // Buscamos los datos del perfil al cargar
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 2. Seleccionamos ambos campos del perfil
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('mercado_pago_email, steam_friend_code')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setMpEmail(profile.mercado_pago_email || '');
          setSteamFriendCode(profile.steam_friend_code || '');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 3. Actualizamos ambos campos en la base de datos
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mercado_pago_email: mpEmail,
          steam_friend_code: steamFriendCode,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
      
      if (error) {
        toast.error("Error al actualizar el perfil", { description: error.message });
      } else {
        toast.success("¡Perfil guardado con éxito!");
      }
    }
    setLoading(false);
  };

  if (loading && mpEmail === null) {
    return <p className="text-gray-400">Cargando perfil...</p>;
  }

  return (
    <Card className="w-full bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Configuración de Perfil y Pagos</CardTitle>
        <CardDescription>
          Completa tus datos para poder vender en la plataforma. Son obligatorios para crear ofertas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="mp-email">Email de Mercado Pago</Label>
            <Input
              id="mp-email"
              type="email"
              value={mpEmail || ''}
              onChange={(e) => setMpEmail(e.target.value)}
              placeholder="tu-email@mercadopago.com"
              className="bg-gray-900 border-gray-600"
              required
            />
          </div>
          {/* 4. Nuevo campo para el código de amigo de Steam */}
          <div className="space-y-1.5">
            <Label htmlFor="steam-code">Código de Amigo de Steam</Label>
            <Input
              id="steam-code"
              type="text"
              value={steamFriendCode || ''}
              onChange={(e) => setSteamFriendCode(e.target.value)}
              placeholder="Ej: 123456789"
              className="bg-gray-900 border-gray-600"
              required
            />
             <p className="text-xs text-gray-400">
                Tu código de amigo es necesario para que los compradores puedan agregarte.
            </p>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}