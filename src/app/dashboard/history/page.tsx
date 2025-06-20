// src/app/dashboard/history/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MyPurchases from "../components/MyPurchases"; // Reutilizamos el componente que ya muestra las compras

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sky-400 hover:underline mb-8 inline-block">&larr; Volver al Dashboard Principal</Link>
        
        {/* Usamos el componente que ya teníamos, que ahora servirá como nuestro historial completo */}
        <MyPurchases />
      </div>
    </main>
  );
}