import { Circle, Grid2X2, LayoutGrid, Calendar, TrendingUp } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { icon: Circle, label: 'Home', path: '/' },
  { icon: Grid2X2, label: 'Closet', path: '/closet' },
  { icon: LayoutGrid, label: 'Outfits', path: '/outfits' },
  { icon: Calendar, label: 'Planner', path: '/planner' },
  { icon: TrendingUp, label: 'Insights', path: '/insights' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="nav-bottom md:hidden border-t-2 border-strong">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-[hsl(var(--sage-light))] rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="text-[10px] font-medium relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
