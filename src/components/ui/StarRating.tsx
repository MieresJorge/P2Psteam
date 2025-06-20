// src/components/ui/StarRating.tsx
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
}

export default function StarRating({ rating, totalStars = 5, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[...Array(totalStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <Star
            key={index}
            size={size}
            fill={starValue <= rating ? '#facc15' : 'none'} // color yellow-400
            stroke={starValue <= rating ? '#facc15' : '#6b7280'} // color gray-500 para las vacías
          />
        );
      })}
    </div>
  );
}