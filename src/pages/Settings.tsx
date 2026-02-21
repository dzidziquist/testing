import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ChevronRight, Sun, Moon, Monitor, 
  User, Lock, LogOut, Trash2, HelpCircle, 
  FileText, Shield, Check, Plus, Loader2, X, Palette
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/useTheme';
import { useAccentColor, AccentColor } from '@/hooks/useAccentColor';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ColorPicker } from '@/components/settings/ColorPicker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const PRESET_COLORS: { id: AccentColor; label: string; color: string }[] = [
  { id: 'black', label: 'Black', color: '#000000' },
  { id: 'beige', label: 'Beige', color: '#D4C4A8' },
  { id: 'brown', label: 'Brown', color: '#8B5A2B' },
  { id: 'olive', label: 'Olive', color: '#6B7B4C' },
  { id: 'charcoal', label: 'Charcoal', color: '#4D4D4D' },
  { id: 'blush', label: 'Blush', color: '#E8B4B8' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { accentColor, setAccentColor, customColors, addCustomColor, removeCustomColor } = useAccentColor();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      toast({ title: 'Password updated successfully' });
      setShowPasswordDialog(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast({
        title: 'Error updating password',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // Delete user data from all tables
      if (user) {
        await supabase.from('wear_history').delete().eq('user_id', user.id);
        await supabase.from('outfit_plans').delete().eq('user_id', user.id);
        await supabase.from('outfits').delete().eq('user_id', user.id);
        await supabase.from('closet_items').delete().eq('user_id', user.id);
        await supabase.from('saved_discover_items').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('user_id', user.id);
      }
      
      await signOut();
      toast({ title: 'Account deleted' });
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'Error deleting account',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAddCustomColor = (color: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      addCustomColor(color);
      setAccentColor(color);
      setShowColorPicker(false);
    } else {
      toast({
        title: 'Invalid color',
        description: 'Please enter a valid hex color (e.g., #FF5733)',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account & style preferences
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 space-y-6"
      >
        {/* Appearance Section */}
        <Card className="p-4 space-y-5">
          <h3 className="font-semibold text-lg">Appearance</h3>
          
          {/* Theme Selection */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setTheme('light')}>
                <RadioGroupItem value="light" id="light" />
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="light" className="flex-1 cursor-pointer">Light</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setTheme('dark')}>
                <RadioGroupItem value="dark" id="dark" />
                <Moon className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="dark" className="flex-1 cursor-pointer">Dark</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border-2 border-border hover:border-primary transition-colors cursor-pointer"
                onClick={() => setTheme('system')}>
                <RadioGroupItem value="system" id="system" />
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="system" className="flex-1 cursor-pointer">System</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Accent Color</Label>
            <div className="flex flex-wrap gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setAccentColor(color.id)}
                  className="relative w-10 h-10 rounded-full border-2 border-border transition-all hover:scale-110"
                  style={{ backgroundColor: color.color }}
                  title={color.label}
                >
                  {accentColor === color.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className={`w-5 h-5 ${color.id === 'black' || color.id === 'charcoal' || color.id === 'brown' ? 'text-white' : 'text-black'}`} />
                    </div>
                  )}
                </button>
              ))}
              {customColors.map((color) => (
                <div key={color} className="relative group">
                  <button
                    onClick={() => setAccentColor(color)}
                    className="relative w-10 h-10 rounded-full border-2 border-border transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {accentColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => removeCustomColor(color)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <Dialog open={showColorPicker} onOpenChange={setShowColorPicker}>
                <DialogTrigger asChild>
                  <button
                    className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center transition-all hover:scale-110 hover:border-primary"
                    title="Add custom color"
                  >
                    <Palette className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Pick Custom Color</DialogTitle>
                  </DialogHeader>
                  <ColorPicker
                    value="#000000"
                    onChange={handleAddCustomColor}
                    onClose={() => setShowColorPicker(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </Card>

        {/* Profile Section */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3">Profile</h3>
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <span>Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>

        {/* Account Section */}
        <Card className="p-4 space-y-1">
          <h3 className="font-semibold text-lg mb-3">Account</h3>
          
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-muted-foreground" />
                  <span>Change Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="current">Current Password</Label>
                  <Input
                    id="current"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new">New Password</Label>
                  <Input
                    id="new"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleChangePassword} 
                  className="w-full"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-3 text-destructive">
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </div>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account
                  and remove all your data including your closet, outfits, and insights.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                  ) : (
                    'Delete Account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <span>Log Out</span>
            </div>
          </button>
        </Card>

        {/* Support Section */}
        <Card className="p-4 space-y-1">
          <h3 className="font-semibold text-lg mb-3">Support</h3>
          
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span>Help & FAQ</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span>Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate('/terms')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <span>Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </Card>
      </motion.div>
    </div>
  );
}
