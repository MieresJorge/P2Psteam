// src/app/profile/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StarRating from "@/components/ui/StarRating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Interfaz para el Perfil (vendedor o comprador)
interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

// Interfaz para la Reseña
interface Review {
  id: number;
  rating: number;
  comment: string | null;
  reviewer_id: string;
  created_at: string;
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const sellerId = params.id;

  // 1. Obtener el perfil del vendedor
  const { data: sellerProfile } = await supabase
    .rpc('get_user_profiles_by_ids', { user_ids: [sellerId] })
    .returns<Profile[]>()
    .single();

  if (!sellerProfile) {
    notFound();
  }

  // 2. Obtener todas las reseñas de este vendedor
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  // 3. Obtener los perfiles de todos los que dejaron una reseña
  let reviewersMap = new Map<string, Profile>();
  if (reviews && reviews.length > 0) {
    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
    
    // Llamamos al RPC sin un tipo estricto para poder normalizarlo
    const { data: reviewersData, error: reviewersError } = await supabase
      .rpc('get_user_profiles_by_ids', { user_ids: reviewerIds });

    if (reviewersError) {
      console.error("Error fetching reviewers:", reviewersError);
    } else if (reviewersData) {
      // --- LA SOLUCIÓN DEFINITIVA: NORMALIZACIÓN ---
      const reviewers = Array.isArray(reviewersData) ? reviewersData : [reviewersData];
      reviewersMap = new Map(reviewers.map((r: Profile) => [r.id, r]));
    }
  }

  // 4. Calcular estadísticas
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0
    ? reviews!.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-sky-400 hover:underline mb-6 inline-block">&larr; Volver al Dashboard</Link>
        
        <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-800 p-8 rounded-lg shadow-lg">
          <Image 
            src={sellerProfile.avatar_url || '/default-avatar.png'}
            alt={`Avatar de ${sellerProfile.name}`}
            width={128}
            height={128}
            className="rounded-full border-4 border-sky-400"
          />
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold">{sellerProfile.name}</h1>
            <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
              <StarRating rating={averageRating} size={24} />
              <span className="text-lg text-gray-400">
                {averageRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-3xl font-bold mb-6">Reseñas de Compradores</h2>
          <div className="space-y-6">
            {reviews && reviews.length > 0 ? (
              reviews.map((review: Review) => {
                const reviewer = reviewersMap.get(review.reviewer_id);
                return (
                  <Card key={review.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="flex flex-row justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={reviewer?.avatar_url || '/default-avatar.png'} 
                          alt={`Avatar de ${reviewer?.name}`}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <CardTitle className="text-md">{reviewer?.name || 'Anónimo'}</CardTitle>
                      </div>
                      <StarRating rating={review.rating} size={16} />
                    </CardHeader>
                    {review.comment && (
                      <CardContent>
                        <p className="text-gray-300 italic">"{review.comment}"</p>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            ) : (
              <p className="text-gray-400">Este vendedor aún no tiene reseñas.</p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}