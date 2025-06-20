// src/app/dashboard/settings/page.tsx
import ProfileManager from "../components/ProfileManager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    // Contenedor principal que ocupa toda la pantalla y centra el contenido
    <main className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Botón para volver, posicionado fuera de la tarjeta */}
        <div className="mb-4">
          <Link href="/dashboard" className="inline-flex items-center text-sky-400 hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </div>
        
        {/* El componente ProfileManager ya es una Card, así que lo usamos directamente */}
        <ProfileManager />
      </div>
    </main>
  );
}