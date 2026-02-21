import { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose?: () => void;
}

export function ColorPicker({ value, onChange, onClose }: ColorPickerProps) {
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(50);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(value || '#000000');
  
  const hueRef = useRef<HTMLDivElement>(null);
  const slRef = useRef<HTMLDivElement>(null);
  const [isDraggingHue, setIsDraggingHue] = useState(false);
  const [isDraggingSL, setIsDraggingSL] = useState(false);

  // Parse initial hex to HSL
  useEffect(() => {
    if (value && /^#[0-9A-Fa-f]{6}$/.test(value)) {
      const { h, s, l } = hexToHSL(value);
      setHue(h);
      setSaturation(s);
      setLightness(l);
      setHexInput(value);
    }
  }, [value]);

  const currentColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const currentHex = hslToHex(hue, saturation, lightness);

  const updateFromHue = useCallback((clientX: number) => {
    if (!hueRef.current) return;
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const newHue = Math.round((x / rect.width) * 360);
    setHue(newHue);
    setHexInput(hslToHex(newHue, saturation, lightness));
  }, [saturation, lightness]);

  const updateFromSL = useCallback((clientX: number, clientY: number) => {
    if (!slRef.current) return;
    const rect = slRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const newSat = Math.round((x / rect.width) * 100);
    const newLight = Math.round(100 - (y / rect.height) * 100);
    setSaturation(newSat);
    setLightness(newLight);
    setHexInput(hslToHex(hue, newSat, newLight));
  }, [hue]);

  const handleHueMouseDown = (e: React.MouseEvent) => {
    setIsDraggingHue(true);
    updateFromHue(e.clientX);
  };

  const handleSLMouseDown = (e: React.MouseEvent) => {
    setIsDraggingSL(true);
    updateFromSL(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHue) updateFromHue(e.clientX);
      if (isDraggingSL) updateFromSL(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      setIsDraggingHue(false);
      setIsDraggingSL(false);
    };

    if (isDraggingHue || isDraggingSL) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHue, isDraggingSL, updateFromHue, updateFromSL]);

  // Touch support
  const handleHueTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    updateFromHue(e.touches[0].clientX);
  };

  const handleSLTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    updateFromSL(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const { h, s, l } = hexToHSL(val);
      setHue(h);
      setSaturation(s);
      setLightness(l);
    }
  };

  const handleConfirm = () => {
    onChange(currentHex);
    onClose?.();
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Saturation/Lightness area */}
      <div
        ref={slRef}
        onMouseDown={handleSLMouseDown}
        onTouchStart={handleSLTouch}
        onTouchMove={handleSLTouch}
        className="relative w-full h-40 rounded-lg cursor-crosshair touch-none select-none"
        style={{
          background: `linear-gradient(to top, #000, transparent), 
                       linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
        }}
      >
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${saturation}%`,
            top: `${100 - lightness}%`,
            backgroundColor: currentColor,
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        onMouseDown={handleHueMouseDown}
        onTouchStart={handleHueTouch}
        onTouchMove={handleHueTouch}
        className="relative w-full h-4 rounded-full cursor-pointer touch-none select-none"
        style={{
          background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      >
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md transform -translate-x-1/2 pointer-events-none"
          style={{
            left: `${(hue / 360) * 100}%`,
            top: '0',
            backgroundColor: `hsl(${hue}, 100%, 50%)`,
          }}
        />
      </div>

      {/* Preview and hex input */}
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Hex Color</Label>
          <Input
            value={hexInput}
            onChange={handleHexChange}
            placeholder="#000000"
            maxLength={7}
            className="mt-1 font-mono"
          />
        </div>
        <div 
          className="w-12 h-10 rounded-lg border-2 border-border shrink-0"
          style={{ backgroundColor: currentHex }}
        />
      </div>

      <Button onClick={handleConfirm} className="w-full">
        Apply Color
      </Button>
    </div>
  );
}

// Helper functions
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}