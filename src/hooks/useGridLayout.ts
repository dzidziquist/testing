import { useState, useEffect } from 'react';
import { GridLayout } from '@/components/closet/LayoutSwitcher';

const STORAGE_KEY = 'closet-grid-layout';

export function useGridLayout() {
  const [layout, setLayout] = useState<GridLayout>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['2', '3', '4'].includes(saved)) {
        return parseInt(saved, 10) as GridLayout;
      }
    }
    return 2; // Default to 2 columns
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, layout.toString());
  }, [layout]);

  return { layout, setLayout };
}
