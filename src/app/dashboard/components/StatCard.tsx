// src/app/dashboard/components/StatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import Link from 'next/link';

// Añadimos una nueva prop opcional 'href'
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
}

export default function StatCard({ title, value, icon: Icon, href }: StatCardProps) {
  // El contenido de la tarjeta se mantiene igual
  const cardContent = (
    <Card className="bg-gray-800 border-gray-700 text-white transition-all duration-200 hover:border-sky-500 hover:bg-gray-800/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="h-5 w-5 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  // Si el componente recibe una prop 'href', envolvemos la tarjeta en un Link.
  if (href) {
    return (
      <Link href={href}>
        {cardContent}
      </Link>
    );
  }

  // Si no, devolvemos la tarjeta normal.
  return cardContent;
}
