// src/components/layout/Navbar.tsx
'use client';
import Link from 'next/link';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  return (
    <nav className="w-full bg-gray-900 bg-opacity-50 backdrop-blur-sm p-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="text-2xl font-bold text-white">
        SteamP2P
      </Link>
      <div className="flex items-center gap-4">
        {!loading && (
          user ? (
            <Link href="/dashboard">
              <Button variant="outline" className="text-white border-white/50 hover:bg-white hover:text-gray-900 transition-colors duration-200">
                Ir al Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth-ui">
                <Button variant="outline" className="transition-colors duration-200 hover:bg-white/10">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth-ui">
                <Button className="bg-white text-gray-900 font-bold hover:bg-gray-200 transition-transform duration-200 ease-in-out hover:scale-105">
                  Registrarse Gratis
                </Button>
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}