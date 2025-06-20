// src/app/dashboard/components/ProfileManager.tsx
'use client';

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfileManager() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [mpEmail, setMpEmail] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  // Usamos useEffect para buscar los datos del perfil cuando el componente carga
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('mercado_pago_email')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setMpEmail(profile.mercado_pago_email || '');
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          mercado_pago_email: mpEmail,
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id);
      
      if (error) {
        setMessage("Error al actualizar: " + error.message);
      } else {
        setMessage("¡Perfil guardado con éxito!");
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
        <CardTitle>Configuración de Pagos</CardTitle>
        <CardDescription>
          Ingresa el email de tu cuenta de Mercado Pago para poder recibir los pagos de tus ventas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
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
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          {message && <p className="text-sm pt-2 text-green-400">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}