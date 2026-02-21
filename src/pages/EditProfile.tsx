import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const bodyTypes = ["Slim", "Athletic", "Average", "Curvy", "Plus Size"];
const skinTones = ["Very Fair", "Fair", "Light", "Medium", "Tan", "Dark", "Deep"];

const colorOptions = [
  "Black",
  "White",
  "Navy",
  "Gray",
  "Beige",
  "Brown",
  "Olive",
  "Burgundy",
  "Blush",
  "Coral",
  "Sage",
  "Cream",
];

const styleOptions = [
  "Casual",
  "Business",
  "Formal",
  "Streetwear",
  "Bohemian",
  "Minimalist",
  "Classic",
  "Sporty",
  "Romantic",
  "Edgy",
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  interface FormData {
    display_name: string;
    location: string;
    body_type: string;
    skin_tone: string;
    height_cm: number;
    preferred_colors: string[];
    preferred_styles: string[];
  }

  const [formData, setFormData] = useState({
    display_name: "",
    location: "",
    body_type: "",
    skin_tone: "",
    height_cm: 170,
    preferred_colors: [] as string[],
    preferred_styles: [] as string[],
  });

  // Sync form data whenever profile changes (including after save + refresh)
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        location: profile.location || "",
        body_type: profile.body_type || "",
        skin_tone: profile.skin_tone || "",
        height_cm: profile.height_cm || 170,
        preferred_colors: profile.preferred_colors || [],
        preferred_styles: profile.preferred_styles || [],
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const updates = {
        ...formData,
        preferred_colors: formData.preferred_colors || [],
        preferred_styles: formData.preferred_styles || [],
      };

      const { error } = await supabase.from("profiles").upsert({ ...updates, user_id: user.id }, { onConflict: "user_id" });

      if (error) throw error;

      await refreshProfile(); // ensures context is updated
      toast({ title: "Profile updated!" });
      navigate("/settings");
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ? array.filter((i) => i !== item) : [...array, item];
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
        <h1 className="section-header">Edit Profile</h1>
        <p className="text-muted-foreground text-sm">Update your personal information</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="px-4 space-y-6"
      >
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center border-2 border-strong">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-semibold text-primary">
                  {formData.display_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
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
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Basic Info</h3>

          <div>
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Used for weather-based outfit suggestions</p>
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
        </Card>

        {/* Body & Appearance */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Body & Appearance</h3>
          <p className="text-xs text-muted-foreground">Used for personalized recommendations</p>

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
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
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
                  <SelectItem key={tone} value={tone}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Preferred Colors */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Favorite Colors</h3>
          <div className="flex flex-wrap gap-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    preferred_colors: toggleArrayItem(formData.preferred_colors, color),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                  formData.preferred_colors.includes(color)
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background text-foreground border-strong"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </Card>

        {/* Preferred Styles */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold">Style Preferences</h3>
          <div className="flex flex-wrap gap-2">
            {styleOptions.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    preferred_styles: toggleArrayItem(formData.preferred_styles, style),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border-2 ${
                  formData.preferred_styles.includes(style)
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "bg-background text-foreground border-strong"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </motion.form>
    </div>
  );
}
