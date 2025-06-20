// src/components/landing/HeroSection.tsx
import Link from 'next/link';
import { Button } from '../ui/button';

export default function HeroSection() {
  return (
    <section className="text-center py-20 md:py-32">
      <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
        Convierte tu Saldo de Steam en Dinero Real
      </h1>
      <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
        La plataforma segura y confiable que te conecta con compradores interesados en tus juegos, permitiéndote transformar tu saldo de Steam en dinero en tu cuenta de Mercado Pago.
      </p>
      <div className="mt-8">
        <Link href="/auth-ui">
          {/* AÑADIMOS LAS CLASES DE TRANSICIÓN Y ANIMACIÓN */}
          <Button 
            size="lg" 
            className="text-lg bg-white text-gray-900 font-bold hover:bg-gray-200 transition-transform duration-200 ease-in-out hover:scale-105"
          >
            Empezar Ahora
          </Button>
        </Link>
      </div>
    </section>
  );
}