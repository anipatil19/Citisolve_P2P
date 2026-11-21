import React, {useState} from 'react';
import {CameraOff} from 'lucide-react';

interface CivicImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const CivicImage: React.FC<CivicImageProps> = ({
  src,
  alt,
  className = 'h-48 w-full object-cover',
  fallbackLabel = 'Civic Issue Evidence',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 ${className}`}
      >
        <CameraOff className="h-6 w-6 text-slate-400" />
        <span className="px-3 text-center text-xs font-medium text-slate-500">
          {fallbackLabel}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
