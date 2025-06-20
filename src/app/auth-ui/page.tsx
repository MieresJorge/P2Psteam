// src/app/auth-ui/page.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import type { AuthError } from '@supabase/supabase-js';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | React.ReactNode>('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const supabase = createClient();

  const handleAction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    let error: AuthError | null = null;

    if (activeTab === 'login') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      error = signInError;
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;
      if (!error && data.user?.identities?.length === 0) {
        setErrorMsg(
          <span>
            Este email ya está registrado. 
            <button 
              type="button" 
              onClick={() => setActiveTab('login')} 
              className="font-bold text-sky-400 hover:underline ml-1 focus:outline-none"
            >
              Iniciar sesión
            </button>
          </span>
        );
        setLoading(false);
        return; 
      }
    }

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (activeTab === 'login') {
        window.location.href = '/dashboard';
      } else {
        setSuccessMsg('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.');
      }
    }
    setLoading(false);
  };
  
  const resetFormState = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white">
      <div className='absolute top-6 left-6'>
        <Link href="/" className="text-2xl font-bold">
          SteamP2P
        </Link>
      </div>

      <Tabs 
        value={activeTab}
        className="w-full max-w-md"
        onValueChange={(value) => {
          setActiveTab(value);
          resetFormState();
        }}
      >
        <TabsList className="grid w-full grid-cols-2 rounded-t-md bg-gray-900">
          <TabsTrigger 
            value="login" 
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-inner py-3 focus:outline-none"
          >
            Iniciar Sesión
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-slate-400 data-[state=active]:shadow-inner py-3 focus:outline-none"
          >
            Registrarse
          </TabsTrigger>
        </TabsList>
        
        <Card className="bg-gray-800 border-gray-700 text-white rounded-t-none">
          <TabsContent value="login" className="m-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Bienvenido de vuelta</CardTitle>
                <CardDescription>Ingresa para acceder a tu panel.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="tu@email.com" onChange={(e) => setEmail(e.target.value)} required className="bg-gray-900 border-gray-600 h-10"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} required className="bg-gray-900 border-gray-600 h-10"/>
                  </div>
                  {errorMsg && <p className="text-sm text-red-500 pt-1 text-center">{errorMsg}</p>}
                  <Button type="submit" className="w-full h-10 font-semibold bg-sky-600 hover:bg-sky-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                    {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register" className="m-0">
              <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
                  <CardDescription>Es rápido y fácil. Empieza a operar en minutos.</CardDescription>
                </CardHeader>
              <CardContent>
                <form onSubmit={handleAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="tu@email.com" onChange={(e) => setEmail(e.target.value)} required className="bg-gray-900 border-gray-600 h-10"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Contraseña</Label>
                    <Input id="register-password" type="password" placeholder="Mínimo 6 caracteres" onChange={(e) => setPassword(e.target.value)} required className="bg-gray-900 border-gray-600 h-10"/>
                  </div>
                  {errorMsg && <p className="text-sm text-red-500 pt-1 text-center">{errorMsg}</p>}
                  {successMsg && <p className="text-sm text-green-400 pt-1 text-center">{successMsg}</p>}
                  <Button type="submit" className="w-full h-10 font-semibold bg-sky-600 hover:bg-sky-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
        </Card>
      </Tabs>
    </main>
  );
}