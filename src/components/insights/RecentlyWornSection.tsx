import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sun, Cloud, CloudRain, Snowflake, MoreVertical, Pencil, Trash2, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CategoryIcon } from '@/components/closet/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface WearEntry {
  id: string;
  worn_at: string;
  notes: string | null;
  weather_conditions: {
    temp?: number;
    condition?: string;
    description?: string;
  } | null;
  items: Array<{
    id: string;
    name: string;
    category: string;
    image_url: string | null;
  }>;
}

interface RecentlyWornSectionProps {
  recentlyWorn: WearEntry[];
  onUpdate?: (id: string, updates: { notes?: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const OCCASION_OPTIONS = ['Work', 'Casual', 'Event', 'Active', 'Date', 'Travel'];

function getOccasionFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  
  const lowered = notes.toLowerCase();
  if (lowered.includes('work') || lowered.includes('office') || lowered.includes('meeting')) {
    return 'Work';
  }
  if (lowered.includes('event') || lowered.includes('party') || lowered.includes('dinner')) {
    return 'Event';
  }
  if (lowered.includes('date') || lowered.includes('romantic')) {
    return 'Date';
  }
  if (lowered.includes('gym') || lowered.includes('workout') || lowered.includes('exercise') || lowered.includes('active')) {
    return 'Active';
  }
  if (lowered.includes('travel') || lowered.includes('trip') || lowered.includes('vacation')) {
    return 'Travel';
  }
  if (lowered.includes('casual') || lowered.includes('weekend') || lowered.includes('errands')) {
    return 'Casual';
  }
  return null;
}

function getWeatherIcon(condition: string | undefined) {
  if (!condition) return Sun;
  
  const lowered = condition.toLowerCase();
  if (lowered.includes('rain') || lowered.includes('drizzle')) return CloudRain;
  if (lowered.includes('snow') || lowered.includes('sleet')) return Snowflake;
  if (lowered.includes('cloud') || lowered.includes('overcast')) return Cloud;
  return Sun;
}

function formatTemp(temp: number | undefined): string | null {
  if (temp === undefined) return null;
  return `${Math.round(temp)}°F`;
}

export function RecentlyWornSection({ recentlyWorn, onUpdate, onDelete }: RecentlyWornSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = (entry: WearEntry) => {
    setEditingId(entry.id);
    setEditNotes(entry.notes || '');
  };

  const handleSave = async (id: string) => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(id, { notes: editNotes || undefined });
      setEditingId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOccasionClick = (occasion: string) => {
    if (editNotes.toLowerCase().includes(occasion.toLowerCase())) return;
    setEditNotes(prev => prev ? `${occasion}, ${prev}` : occasion);
  };

  if (recentlyWorn.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-8"
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recently Worn
        </h2>
        <p className="text-xs text-muted-foreground bg-card rounded-xl p-4 border-2 border-strong">
          No wear history yet. Start logging what you wear!
        </p>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="px-4 mb-8"
      >
        <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recently Worn
        </h2>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {recentlyWorn.map((entry) => {
              const occasion = getOccasionFromNotes(entry.notes);
              const weather = entry.weather_conditions;
              const temp = formatTemp(weather?.temp);
              const WeatherIcon = getWeatherIcon(weather?.condition);
              const timeAgo = formatDistanceToNow(new Date(entry.worn_at), { addSuffix: true });
              const isEditing = editingId === entry.id;
              
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-card rounded-xl p-3 border-2 border-strong"
                >
                  {isEditing ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 shrink-0">
                          {entry.items.slice(0, 2).map((item, idx) => (
                            <div
                              key={item.id}
                              className="w-8 h-8 rounded-lg overflow-hidden bg-secondary flex items-center justify-center border-2 border-card"
                              style={{ zIndex: 2 - idx }}
                            >
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <CategoryIcon category={item.category as any} className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm font-medium truncate flex-1">
                          {entry.items.length === 1 ? entry.items[0].name : `${entry.items.length} items`}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-7 w-7"
                            onClick={() => handleSave(entry.id)}
                            disabled={isSaving}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Quick occasion tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {OCCASION_OPTIONS.map(occ => (
                          <Badge
                            key={occ}
                            variant="outline"
                            className={cn(
                              "text-xs cursor-pointer transition-colors",
                              editNotes.toLowerCase().includes(occ.toLowerCase())
                                ? "bg-primary/20 text-primary border-primary/40"
                                : "hover:bg-secondary"
                            )}
                            onClick={() => handleOccasionClick(occ)}
                          >
                            {occ}
                          </Badge>
                        ))}
                      </div>
                      
                      <Input
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes (e.g., Work meeting, Casual brunch)"
                        className="h-9 text-sm"
                      />
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center gap-3">
                      {/* Item thumbnails */}
                      <div className="flex -space-x-2 shrink-0">
                        {entry.items.slice(0, 3).map((item, idx) => (
                          <div
                            key={item.id}
                            className="w-10 h-10 rounded-lg overflow-hidden bg-secondary flex items-center justify-center border-2 border-card"
                            style={{ zIndex: 3 - idx }}
                          >
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <CategoryIcon category={item.category as any} className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                        {entry.items.length > 3 && (
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border-2 border-card text-xs font-medium text-muted-foreground">
                            +{entry.items.length - 3}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {entry.items.length === 1 
                            ? entry.items[0].name 
                            : `${entry.items.length} items`}
                        </p>
                        
                        {/* Context row with chips */}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {occasion && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 font-medium shrink-0",
                                occasion === 'Work' && 'bg-primary/10 text-primary border-primary/30',
                                occasion === 'Event' && 'bg-accent/50 text-accent-foreground border-accent',
                                occasion === 'Date' && 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800',
                                occasion === 'Active' && 'bg-destructive/10 text-destructive border-destructive/30',
                                occasion === 'Travel' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                                occasion === 'Casual' && 'bg-secondary text-secondary-foreground border-border'
                              )}
                            >
                              {occasion}
                            </Badge>
                          )}
                          
                          {temp && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <WeatherIcon className="w-3 h-3" />
                              {temp}
                            </span>
                          )}
                          
                          <span className="text-[10px] text-muted-foreground">
                            {(occasion || temp) && '• '}{timeAgo}
                          </span>
                        </div>
                      </div>

                      {/* Actions menu */}
                      {(onUpdate || onDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onUpdate && (
                              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(entry.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete wear entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this entry from your wear history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}