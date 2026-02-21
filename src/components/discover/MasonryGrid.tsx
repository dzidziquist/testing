import { ReactNode } from 'react';

interface MasonryGridProps {
  children: ReactNode;
}

export function MasonryGrid({ children }: MasonryGridProps) {
  return (
    <div className="columns-2 gap-3">
      {children}
    </div>
  );
}
