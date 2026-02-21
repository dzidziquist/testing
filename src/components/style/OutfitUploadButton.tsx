import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2, X, Save, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/circular-progress';
import { useToast } from '@/hooks/use-toast';
import { useOutfits } from '@/hooks/useOutfits';
import { authenticatedFetch } from '@/lib/auth-fetch';

interface OutfitUploadButtonProps {
  onAnalysisComplete?: (result: OutfitAnalysis) => void;
  variant?: 'default' | 'icon';
}

export interface OutfitAnalysis {
  score: number;
  reasoning: string;
  suggestions: string[];
  detectedItems: {
    category: string;
    color: string;
    description: string;
  }[];
  shoppingLinks?: { name: string; url: string; store: string }[];
}

export function OutfitUploadButton({ onAnalysisComplete, variant = 'default' }: OutfitUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<OutfitAnalysis | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createOutfit } = useOutfits();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setIsUploading(false);
      
      // Start analysis
      await analyzeOutfit(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeOutfit = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const response = await authenticatedFetch('analyze-outfit', { imageUrl: imageData });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to analyze outfit');
      }

      setAnalysis(result.data);
      onAnalysisComplete?.(result.data);
      
      toast({
        title: 'Outfit analyzed!',
        description: `Score: ${result.data.score}/100`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Could not analyze outfit',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveOutfit = async () => {
    if (!imagePreview || !analysis) return;
    
    setIsSaving(true);
    try {
      await createOutfit({
        name: `Uploaded Outfit - ${new Date().toLocaleDateString()}`,
        item_ids: [], // No specific items since it's an uploaded photo
        is_ai_generated: false,
        image_url: imagePreview,
        occasion: 'casual',
        score: analysis.score,
      });
      
      toast({
        title: 'Outfit saved!',
        description: 'Added to your outfit collection',
      });
      
      // Reset
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Could not save outfit',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isIcon = variant === 'icon';

  return (
    <div className="relative">
      {/* File input without capture to allow camera roll selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {!imagePreview ? (
        isIcon ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAnalyzing}
            title="Upload outfit photo"
          >
            {isUploading || isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4" />
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            Upload Outfit
          </Button>
        )
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            {/* Image Preview */}
            <div className="relative">
              <img
                src={imagePreview}
                alt="Outfit preview"
                className="w-full max-h-48 object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 w-7 h-7"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
              
              {/* Score overlay */}
              {analysis && (
                <div className="absolute bottom-2 left-2">
                  <CircularProgress
                    value={analysis.score}
                    size={56}
                    strokeWidth={4}
                    showValue
                  />
                </div>
              )}
            </div>
            
            {/* Analysis Content */}
            <div className="p-3">
              {isAnalyzing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your outfit...
                </div>
              ) : analysis ? (
                <div className="space-y-3">
                  <p className="text-sm">{analysis.reasoning}</p>
                  
                  {analysis.suggestions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {analysis.suggestions.slice(0, 2).map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Shopping Links */}
                  {analysis.shoppingLinks && analysis.shoppingLinks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Shop similar:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.shoppingLinks.map((link, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => window.open(link.url, '_blank')}
                          >
                            {link.store}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSaveOutfit}
                    disabled={isSaving}
                    size="sm"
                    className="w-full"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save to Outfits
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
