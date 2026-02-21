import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AccentColor = 'black' | 'beige' | 'brown' | 'olive' | 'charcoal' | 'blush' | string;

interface AccentColorContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  customColors: string[];
  addCustomColor: (color: string) => void;
  removeCustomColor: (color: string) => void;
}

const AccentColorContext = createContext<AccentColorContextType | undefined>(undefined);

const ACCENT_COLOR_MAP: Record<string, string> = {
  black: '0 0% 0%',
  beige: '40 30% 75%',
  brown: '25 40% 35%',
  olive: '80 30% 35%',
  charcoal: '0 0% 30%',
  blush: '350 50% 70%',
};

export function AccentColorProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('accent_color') as AccentColor) || 'black';
    }
    return 'black';
  });
  const [customColors, setCustomColors] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('custom_accent_colors');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Load from profile when available
  useEffect(() => {
    if (profile?.accent_color) {
      setAccentColorState(profile.accent_color as AccentColor);
    }
  }, [profile]);

  const applyAccentColor = (color: AccentColor) => {
    const root = window.document.documentElement;
    let hslValue = ACCENT_COLOR_MAP[color];
    
    // If it's a custom hex color
    if (!hslValue && color.startsWith('#')) {
      hslValue = hexToHsl(color);
    }
    
    if (hslValue) {
      root.style.setProperty('--primary', hslValue);
      // Also update primary-foreground for contrast
      const lightness = parseInt(hslValue.split(' ')[2]);
      const foregroundLightness = lightness > 50 ? '0 0% 10%' : '0 0% 98%';
      root.style.setProperty('--primary-foreground', foregroundLightness);
    }
  };

  useEffect(() => {
    applyAccentColor(accentColor);
    localStorage.setItem('accent_color', accentColor);
    
    // Save to database if user is logged in
    if (user) {
      supabase
        .from('profiles')
        .update({ accent_color: accentColor })
        .eq('user_id', user.id)
        .then(() => {});
    }
  }, [accentColor, user]);

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
  };

  const addCustomColor = (color: string) => {
    if (!customColors.includes(color)) {
      const newColors = [...customColors, color];
      setCustomColors(newColors);
      localStorage.setItem('custom_accent_colors', JSON.stringify(newColors));
    }
  };

  const removeCustomColor = (color: string) => {
    const newColors = customColors.filter(c => c !== color);
    setCustomColors(newColors);
    localStorage.setItem('custom_accent_colors', JSON.stringify(newColors));
    // If the removed color was active, switch to default
    if (accentColor === color) {
      setAccentColor('black');
    }
  };

  return (
    <AccentColorContext.Provider value={{ accentColor, setAccentColor, customColors, addCustomColor, removeCustomColor }}>
      {children}
    </AccentColorContext.Provider>
  );
}

export function useAccentColor() {
  const context = useContext(AccentColorContext);
  if (context === undefined) {
    throw new Error('useAccentColor must be used within an AccentColorProvider');
  }
  return context;
}

// Helper to convert hex to HSL
function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
