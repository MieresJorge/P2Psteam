// src/components/landing/FeaturesSection.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Upload, Repeat, Gift, DollarSign } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Publica tu Oferta',
    description: 'Ofrece tu saldo disponible y establece el descuento que quieras para atraer compradores rápidamente.'
  },
  {
    icon: Repeat,
    title: 'Recibe una Solicitud',
    description: 'Un comprador te pedirá un juego específico y pagará a la plataforma, asegurando los fondos.'
  },
  {
    icon: Gift,
    title: 'Envía el Regalo',
    description: 'Una vez el pago está asegurado, compras el juego solicitado en Steam y se lo envías como regalo al comprador.'
  },
  {
    icon: DollarSign,
    title: 'Recibe tu Dinero',
    description: 'Cuando el comprador confirma la recepción, liberamos tu pago directamente a tu cuenta de Mercado Pago.'
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white">¿Cómo Funciona?</h2>
        {/* CAMBIO EN LA SIGUIENTE LÍNEA */}
        <p className="text-slate-300 mt-2">Un proceso simple, rápido y seguro en 4 pasos.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <Card key={index} className="bg-gray-800 border-gray-700 text-white text-center p-6">
            <CardHeader>
              <div className="mx-auto bg-gray-900 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                <feature.icon className="w-8 h-8 text-sky-400" />
              </div>
              <CardTitle>{feature.title}</CardTitle>
            </CardHeader>
            {/* CAMBIO EN LA SIGUIENTE LÍNEA */}
            <CardDescription className="text-slate-300">
              {feature.description}
            </CardDescription>
          </Card>
        ))}
      </div>
    </section>
  );
}