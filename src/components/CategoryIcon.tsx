import React from 'react';
import { 
  Utensils, 
  Car, 
  Home, 
  Film, 
  HeartPulse, 
  ShoppingBag, 
  GraduationCap, 
  Sparkles, 
  CircleEllipsis,
  HelpCircle
} from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = 'w-5 h-5', size }: CategoryIconProps) {
  const norm = name.toLowerCase();

  if (norm.includes('aliment')) return <Utensils className={className} size={size} />;
  if (norm.includes('transp')) return <Car className={className} size={size} />;
  if (norm.includes('morad') || norm.includes('conta')) return <Home className={className} size={size} />;
  if (norm.includes('lazer') || norm.includes('entreten')) return <Film className={className} size={size} />;
  if (norm.includes('saud') || norm.includes('bem-estar')) return <HeartPulse className={className} size={size} />;
  if (norm.includes('compr') || norm.includes('vest')) return <ShoppingBag className={className} size={size} />;
  if (norm.includes('educa')) return <GraduationCap className={className} size={size} />;
  if (norm.includes('servi') || norm.includes('assinat')) return <Sparkles className={className} size={size} />;
  if (norm.includes('outr')) return <CircleEllipsis className={className} size={size} />;

  return <HelpCircle className={className} size={size} />;
}
