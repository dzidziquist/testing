import { motion } from 'framer-motion';
import { Palette, Sparkles, Plus, Shirt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StyleSpectrumSectionProps {
  topColors: [string, number][];
  totalItems: number;
}

// Comprehensive color map
const colorMap: Record<string, string> = {
  // Neutrals
  black: '#1a1a1a',
  white: '#f5f5f5',
  ivory: '#fffff0',
  cream: '#fffdd0',
  offwhite: '#faf9f6',
  'off-white': '#faf9f6',
  
  // Grays
  grey: '#6b7280',
  gray: '#6b7280',
  'light grey': '#d1d5db',
  'light gray': '#d1d5db',
  'dark grey': '#374151',
  'dark gray': '#374151',
  charcoal: '#36454f',
  silver: '#c0c0c0',
  slate: '#708090',
  ash: '#b2beb5',
  
  // Blues
  navy: '#1e3a5f',
  blue: '#3b82f6',
  'light blue': '#93c5fd',
  'dark blue': '#1e40af',
  cobalt: '#0047ab',
  royal: '#4169e1',
  sky: '#87ceeb',
  teal: '#14b8a6',
  turquoise: '#40e0d0',
  aqua: '#00ffff',
  cyan: '#00bcd4',
  denim: '#1560bd',
  indigo: '#4b0082',
  
  // Reds
  red: '#ef4444',
  'dark red': '#991b1b',
  burgundy: '#800020',
  maroon: '#800000',
  wine: '#722f37',
  crimson: '#dc143c',
  scarlet: '#ff2400',
  ruby: '#e0115f',
  cherry: '#de3163',
  
  // Pinks
  pink: '#ec4899',
  'light pink': '#fbcfe8',
  'hot pink': '#ff69b4',
  blush: '#de5d83',
  rose: '#ff007f',
  salmon: '#fa8072',
  coral: '#ff7f50',
  peach: '#ffcba4',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  
  // Greens
  green: '#22c55e',
  'dark green': '#166534',
  'light green': '#90ee90',
  'olive green': '#808000',
  olive: '#808000',
  forest: '#228b22',
  emerald: '#50c878',
  jade: '#00a86b',
  mint: '#98fb98',
  sage: '#9dc183',
  lime: '#32cd32',
  hunter: '#355e3b',
  army: '#4b5320',
  
  // Yellows
  yellow: '#eab308',
  mustard: '#d4a017',
  gold: '#ffd700',
  lemon: '#fff44f',
  canary: '#ffef00',
  
  // Oranges
  orange: '#f97316',
  tangerine: '#ff9966',
  rust: '#b7410e',
  terracotta: '#e2725b',
  copper: '#b87333',
  bronze: '#cd7f32',
  apricot: '#fbceb1',
  
  // Purples
  purple: '#a855f7',
  lavender: '#e6e6fa',
  violet: '#8b5cf6',
  plum: '#dda0dd',
  mauve: '#e0b0ff',
  lilac: '#c8a2c8',
  grape: '#6f2da8',
  amethyst: '#9966cc',
  eggplant: '#614051',
  
  // Browns
  brown: '#92400e',
  chestnut: '#954535',
  chocolate: '#7b3f00',
  espresso: '#3c2415',
  coffee: '#6f4e37',
  mocha: '#967969',
  tan: '#d2b48c',
  camel: '#c19a6b',
  khaki: '#c3b091',
  beige: '#f5f5dc',
  nude: '#e3bc9a',
  mahogany: '#c04000',
  auburn: '#a52a2a',
  cinnamon: '#d2691e',
  sienna: '#a0522d',
  umber: '#635147',
  taupe: '#483c32',
  sand: '#c2b280',
  caramel: '#ffd59a',
  cognac: '#9a463d',
  walnut: '#773f1a',
};

// Color harmony suggestions
function getColorInsight(colors: string[]): string {
  if (colors.length === 0) return '';
  
  const colorCategories = colors.map(c => {
    const lower = c.toLowerCase();
    if (['black', 'white', 'grey', 'gray', 'charcoal', 'ivory', 'cream'].some(n => lower.includes(n))) return 'neutral';
    if (['blue', 'navy', 'teal', 'turquoise', 'cobalt', 'denim'].some(n => lower.includes(n))) return 'cool';
    if (['red', 'orange', 'yellow', 'burgundy', 'rust', 'coral'].some(n => lower.includes(n))) return 'warm';
    if (['green', 'olive', 'sage', 'mint', 'forest'].some(n => lower.includes(n))) return 'earthy';
    if (['pink', 'purple', 'lavender', 'violet', 'rose'].some(n => lower.includes(n))) return 'romantic';
    if (['brown', 'tan', 'beige', 'camel', 'chestnut'].some(n => lower.includes(n))) return 'earthy';
    return 'neutral';
  });
  
  const uniqueCategories = [...new Set(colorCategories)];
  
  if (uniqueCategories.length === 1) {
    if (uniqueCategories[0] === 'neutral') return 'Your wardrobe is versatile with a neutral foundation. Consider adding a pop of color for visual interest.';
    if (uniqueCategories[0] === 'cool') return 'You gravitate toward cool tones. These create a calm, sophisticated look.';
    if (uniqueCategories[0] === 'warm') return 'Your palette is warm and inviting. These colors bring energy to your outfits.';
    if (uniqueCategories[0] === 'earthy') return 'You have a grounded, natural aesthetic. Earth tones are timeless and easy to mix.';
    return 'You have a cohesive color story in your wardrobe.';
  }
  
  if (uniqueCategories.includes('neutral') && uniqueCategories.length === 2) {
    return 'Great balance! Your neutrals pair perfectly with your accent colors for effortless styling.';
  }
  
  return 'You have a diverse palette that allows for creative outfit combinations.';
}

function getColorValue(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();
  
  if (colorMap[normalized]) return colorMap[normalized];
  
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  
  const cssColorNames = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white', 'gray', 'grey'];
  for (const cssColor of cssColorNames) {
    if (normalized.includes(cssColor)) return colorMap[cssColor] || cssColor;
  }
  
  return '#9ca3af';
}

export function StyleSpectrumSection({ topColors, totalItems }: StyleSpectrumSectionProps) {
  const navigate = useNavigate();
  
  if (topColors.length === 0) {
    return null;
  }

  const colorNames = topColors.map(([color]) => color);
  const insight = getColorInsight(colorNames);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="px-4 mb-6"
    >
      <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Palette className="w-4 h-4" />
        Style Spectrum
      </h2>
      
      <div className="bg-card rounded-xl p-4 border-2 border-strong space-y-4">
        {/* Color circles row */}
        <div className="flex items-center gap-3">
          {topColors.slice(0, 4).map(([color], index) => (
            <motion.div
              key={color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="w-8 h-8 rounded-full border-2 border-strong shadow-sm"
              style={{ backgroundColor: getColorValue(color) }}
              title={color}
            />
          ))}
        </div>

        {/* Color breakdown */}
        <div className="space-y-2">
          {topColors.slice(0, 4).map(([color, count], index) => {
            const percentage = Math.round((count / totalItems) * 100);
            const colorValue = getColorValue(color);
            
            return (
              <motion.div 
                key={color} 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: colorValue }}
                />
                <span className="text-sm capitalize flex-1">{color.toLowerCase()}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: colorValue }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{percentage}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI Insight */}
        {insight && (
          <div className="flex gap-2 p-3 bg-secondary/50 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{insight}</p>
          </div>
        )}

        {/* CTAs */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs border-2 border-strong"
            onClick={() => navigate('/closet/add')}
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add balancing color
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs border-2 border-strong"
            onClick={() => navigate('/outfits/create')}
          >
            <Shirt className="w-3.5 h-3.5 mr-1.5" />
            Build from palette
          </Button>
        </div>
      </div>
    </motion.section>
  );
}