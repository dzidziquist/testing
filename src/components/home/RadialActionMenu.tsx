import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Camera, Receipt, Link2, PenLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

export function RadialActionMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions: ActionItem[] = [
    {
      icon: <Camera className="w-5 h-5" />,
      label: 'Photo',
      action: () => navigate('/closet/add?mode=photo'),
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      label: 'Receipt',
      action: () => navigate('/closet/add?mode=receipt'),
    },
    {
      icon: <Link2 className="w-5 h-5" />,
      label: 'Link',
      action: () => navigate('/closet/add?mode=link'),
    },
    {
      icon: <PenLine className="w-5 h-5" />,
      label: 'Manual',
      action: () => navigate('/closet/add?mode=manual'),
    },
  ];

  const handleActionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Stack items vertically above the FAB
  const getItemPosition = (index: number, total: number) => {
    const spacing = 70;
    return {
      x: 0,
      y: -(spacing * (total - index)),
    };
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Container */}
      <div className="fixed bottom-24 right-6 z-50">
        {/* Action Items */}
        <AnimatePresence>
          {isOpen && actions.map((item, index) => {
            const position = getItemPosition(index, actions.length);
            return (
              <motion.button
                key={item.label}
                initial={{ 
                  scale: 0, 
                  opacity: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{ 
                  scale: 1, 
                  opacity: 1,
                  x: position.x,
                  y: position.y,
                }}
                exit={{ 
                  scale: 0, 
                  opacity: 0,
                  x: 0,
                  y: 0,
                }}
                transition={{ 
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  delay: index * 0.05,
                }}
                onClick={() => handleActionClick(item.action)}
                className="absolute bottom-0 right-0 flex items-center gap-3"
              >
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.03 }}
                  className="text-sm font-medium text-foreground bg-card px-3 py-1.5 rounded-full shadow-md border border-border whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-strong">
                  {item.icon}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          onClick={toggleMenu}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:bg-primary/90 transition-colors relative z-10 border-2 border-strong"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 400,
              damping: 25,
            }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
