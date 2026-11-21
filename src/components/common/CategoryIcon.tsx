import React from 'react';
import {
  AlertCircle,
  Construction,
  Droplets,
  LampFloor,
  Trash2,
  Trees,
  Waves,
  Zap,
} from 'lucide-react';
import type {IssueCategoryId} from '../../types/civic';

export const CategoryIcon: React.FC<{
  category: IssueCategoryId;
  className?: string;
}> = ({category, className = 'h-4 w-4'}) => {
  switch (category) {
    case 'potholes_roads':
      return <Construction className={className} aria-hidden="true" />;
    case 'garbage_dumps':
      return <Trash2 className={className} aria-hidden="true" />;
    case 'drainage':
      return <Waves className={className} aria-hidden="true" />;
    case 'electricity':
      return <Zap className={className} aria-hidden="true" />;
    case 'water_issues':
      return <Droplets className={className} aria-hidden="true" />;
    case 'defective_streetlights':
      return <LampFloor className={className} aria-hidden="true" />;
    case 'fallen_trees_obstructions':
      return <Trees className={className} aria-hidden="true" />;
    case 'other_civic':
    default:
      return <AlertCircle className={className} aria-hidden="true" />;
  }
};
