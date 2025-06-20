// src/app/dashboard/components/RatingForm.tsx
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Usaremos un nuevo componente de Shadcn
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

interface Transaction {
  id: number;
  seller_id: string;
}

interface RatingFormProps {
  transaction: Transaction;
  buyer: User;
}

export default function RatingForm({ transaction, buyer }: RatingFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor, selecciona al menos una estrella.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from('reviews').insert({
      transaction_id: transaction.id,
      reviewer_id: buyer.id,
      seller_id: transaction.seller_id,
      rating: rating,
      comment: comment,
    });

    if (error) {
      alert("Error al enviar la reseña: " + error.message);
    } else {
      alert("¡Gracias por tu reseña!");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4 space-y-4">
      <h4 className="font-semibold text-center">Califica tu experiencia con el vendedor</h4>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="cursor-pointer transition-colors"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            fill={star <= (hoverRating || rating) ? '#facc15' : 'none'} // color yellow-400
            stroke={star <= (hoverRating || rating) ? '#facc15' : 'currentColor'}
          />
        ))}
      </div>
      <Textarea
        placeholder="Deja un comentario opcional..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="bg-gray-900 border-gray-600"
      />
      <Button onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? 'Enviando...' : 'Publicar Reseña'}
      </Button>
    </div>
  );
}