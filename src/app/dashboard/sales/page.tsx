// src/app/dashboard/sales/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MySales from "../components/MySales"; // Importamos el componente que ya funciona

export default function SalesPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sky-400 hover:underline mb-8 inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Volver al Dashboard
        </Link>
        
        {/* Usamos directamente nuestro componente MySales, que ya tiene toda la lógica 
          para buscar y mostrar las ventas activas del usuario.
        */}
        <MySales />
      </div>
    </main>
  );
}