import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const bodyTypes = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size'];
const skinTones = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Dark', 'Deep'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    body_type: profile?.body_type || '',
    skin_tone: profile?.skin_tone || '',
    height_cm: profile?.height_cm || 170,
    preferred_colors: profile?.preferred_colors || [],
    preferred_styles: profile?.preferred_styles || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: 'Profile updated!' });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const colorOptions = [
    'Black', 'White', 'Navy', 'Gray', 'Beige', 'Brown', 
    'Olive', 'Burgundy', 'Blush', 'Coral', 'Sage', 'Cream'
  ];

  const styleOptions = [
    'Casual', 'Business', 'Formal', 'Streetwear', 'Bohemian', 
    'Minimalist', 'Classic', 'Sporty', 'Romantic', 'Edgy'
  ];

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (!user) {
    return null;
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">Profile Settings</h1>
        <p className="text-muted-foreground text-sm">
          Customize your style preferences
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="px-4 space-y-8"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-[hsl(var(--sage-light))] flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-3xl font-serif text-primary">
                  {formData.display_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-medium"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        {/* Basic Info */}
        <div className="bg-card rounded-xl p-4 border-2 border-strong space-y-4">
          <h3 className="font-medium">Basic Info</h3>
          
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Height: {formData.height_cm} cm</Label>
            <Slider
              value={[formData.height_cm]}
              onValueChange={([value]) => setFormData({ ...formData, height_cm: value })}
              min={140}
              max={210}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        {/* Body & Appearance */}
        <div className="bg-card rounded-xl p-4 border-2 border-strong space-y-4">
          <h3 className="font-medium">Body & Appearance</h3>
          <p className="text-xs text-muted-foreground">
            Used for personalized recommendations and virtual try-on
          </p>

          <div>
            <Label htmlFor="bodyType">Body Type</Label>
            <Select 
              value={formData.body_type}
              onValueChange={(value) => setFormData({ ...formData, body_type: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="skinTone">Skin Tone</Label>
            <Select 
              value={formData.skin_tone}
              onValueChange={(value) => setFormData({ ...formData, skin_tone: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select skin tone" />
              </SelectTrigger>
              <SelectContent>
                {skinTones.map((tone) => (
                  <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preferred Colors */}
        <div className="bg-card rounded-xl p-4 border-2 border-strong space-y-4">
          <h3 className="font-medium">Favorite Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  preferred_colors: toggleArrayItem(formData.preferred_colors, color) 
                })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                  formData.preferred_colors.includes(color)
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-background text-foreground border-strong'
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Styles */}
        <div className="bg-card rounded-xl p-4 border-2 border-strong space-y-4">
          <h3 className="font-medium">Style Preferences</h3>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  preferred_styles: toggleArrayItem(formData.preferred_styles, style) 
                })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                  formData.preferred_styles.includes(style)
                    ? 'bg-primary text-primary-foreground border-transparent'
                    : 'bg-background text-foreground border-strong'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-xl p-4 shadow-soft space-y-4 border-2 border-border">
          <h3 className="font-medium">Settings</h3>
          
          <div>
            <Label>Theme</Label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                  theme === 'light'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors ${
                  theme === 'system'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                <Monitor className="w-4 h-4" />
                System
              </button>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-[image:var(--gradient-sage)] text-primary-foreground"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </motion.form>
    </div>
  );
}
