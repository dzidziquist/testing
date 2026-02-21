import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Link as LinkIcon, Receipt, Pencil, ArrowLeft, Loader2, Sparkles, LogIn } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClosetItems } from '@/hooks/useClosetItems';
import { useAuth } from '@/hooks/useAuth';
import { ItemCategory, ItemStatus, CATEGORY_LABELS, STATUS_LABELS } from '@/types/closet';
import { authenticatedFetch } from '@/lib/auth-fetch';

type AddMethod = 'photo' | 'link' | 'receipt' | 'manual';

const addMethods = [
  { id: 'photo' as AddMethod, icon: Camera, label: 'Photo', desc: 'Take or upload a photo' },
  { id: 'link' as AddMethod, icon: LinkIcon, label: 'Product Link', desc: 'Paste a product URL' },
  { id: 'receipt' as AddMethod, icon: Receipt, label: 'Receipt', desc: 'Scan a receipt' },
  { id: 'manual' as AddMethod, icon: Pencil, label: 'Manual', desc: 'Enter details manually' },
];

const methodTitles: Record<AddMethod, string> = {
  photo: 'Add from Photo',
  receipt: 'Scan Receipt',
  link: 'Add from Link',
  manual: 'Add Manually',
};

const methodDescriptions: Record<AddMethod, string> = {
  photo: 'Upload a photo and we\'ll auto-detect details',
  receipt: 'Scan your receipt to extract item details',
  link: 'Paste a product URL to import details',
  manual: 'Enter your clothing item details',
};

export default function AddItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { addItem } = useClosetItems();
  const { user, loading: authLoading } = useAuth();
  
  // Check for mode from URL params
  const modeFromUrl = searchParams.get('mode') as AddMethod | null;
  const validModes: AddMethod[] = ['photo', 'link', 'receipt', 'manual'];
  const initialMethod = modeFromUrl && validModes.includes(modeFromUrl) ? modeFromUrl : null;
  
  const [method, setMethod] = useState<AddMethod | null>(initialMethod);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Update method when URL changes
  useEffect(() => {
    if (modeFromUrl && validModes.includes(modeFromUrl)) {
      setMethod(modeFromUrl);
    }
  }, [modeFromUrl]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'tops' as ItemCategory,
    brand: '',
    color: '',
    status: 'active' as ItemStatus,
    productUrl: '',
  });

  // Show auth required message if not logged in
  if (!authLoading && !user) {
    return (
      <div className="pb-8">
        <div className="px-4 pt-4 pb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="section-header">Add to Closet</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4"
        >
          <div className="bg-card rounded-2xl p-8 text-center shadow-soft">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
            <p className="text-muted-foreground text-sm mb-6">
              You need to be signed in to add items to your closet.
            </p>
            <Button asChild className="w-full">
              <Link to="/auth">Sign In or Sign Up</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!imagePreview) {
      toast({ title: 'Please upload an image first', variant: 'destructive' });
      return;
    }

    setAnalyzing(true);
    try {
      const response = await authenticatedFetch('analyze-clothing', { imageUrl: imagePreview });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to analyze image');
      }

      const { data } = result;

      // Update form with analyzed data
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        color: data.color || prev.color,
        category: data.category || prev.category,
      }));

      toast({ 
        title: 'AI analysis complete!',
        description: `Detected: ${data.name || 'clothing item'}`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Could not analyze image',
        description: error instanceof Error ? error.message : 'Please enter details manually',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleScrapeProduct = async () => {
    if (!formData.productUrl) {
      toast({ title: 'Please enter a product URL', variant: 'destructive' });
      return;
    }

    setScraping(true);
    try {
      const response = await authenticatedFetch('scrape-product', { url: formData.productUrl });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw new Error('Service temporarily unavailable. Please try again.');
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to scrape product');
      }

      const { data } = result;

      // Update form with scraped data
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        color: data.color || prev.color,
        category: (data.category as ItemCategory) || prev.category,
        productUrl: data.productUrl || prev.productUrl,
      }));

      // Set image if available
      if (data.imageUrl) {
        setImagePreview(data.imageUrl);
      }

      toast({ 
        title: 'Product details extracted!',
        description: 'Review and edit the details before saving.',
      });
    } catch (error) {
      console.error('Scrape error:', error);
      
      // Better error messages for common issues
      let message = 'Please enter details manually';
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        message = 'Network error. Please check your connection and try again.';
      } else if (error instanceof Error) {
        message = error.message;
      }
      
      toast({
        title: 'Could not extract details',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setScraping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await addItem({
        name: formData.name,
        category: formData.category,
        brand: formData.brand || undefined,
        color: formData.color || undefined,
        status: formData.status,
        product_url: formData.productUrl || undefined,
        image_url: imagePreview || undefined,
      });

      toast({ title: 'Item added successfully!' });
      navigate('/closet');
    } catch (error: any) {
      toast({ title: 'Error adding item', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="section-header">
          {method ? methodTitles[method] : 'Add to Closet'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {method ? methodDescriptions[method] : 'Choose how you\'d like to add your item'}
        </p>
      </div>

      {!method ? (
        /* Method Selection */
        <div className="px-4 grid grid-cols-2 gap-3">
          {addMethods.map((m, index) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setMethod(m.id)}
              className="bg-card rounded-xl p-6 shadow-soft text-left card-interactive"
            >
              <div className="w-12 h-12 rounded-xl bg-[hsl(var(--sage-light))] flex items-center justify-center mb-4">
                <m.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">{m.label}</h3>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </motion.button>
          ))}
        </div>
      ) : (
        /* Form */
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={handleSubmit}
          className="px-4 space-y-6"
        >
          {/* Back button - only show if we came from URL mode */}
          {initialMethod && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/closet/add')}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              All Methods
            </Button>
          )}
          {!initialMethod && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setMethod(null)}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}

          {/* Image Upload (for photo method) */}
          {(method === 'photo' || method === 'receipt') && (
            <div>
              <Label>Image</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          setImageFile(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleAnalyzeImage}
                      disabled={analyzing}
                    >
                      {analyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Auto-detect Details
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <label className="block aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Camera className="w-10 h-10 mb-2" />
                      <span className="text-sm">Tap to upload</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Product URL (for link method) */}
          {method === 'link' && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="productUrl">Product URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="productUrl"
                    type="url"
                    placeholder="https://..."
                    value={formData.productUrl}
                    onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleScrapeProduct}
                    disabled={scraping || !formData.productUrl}
                  >
                    {scraping ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Fetch
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a product URL and click Fetch to auto-fill details
                </p>
              </div>

              {/* Image preview for link method */}
              {imagePreview && (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary max-w-[200px]">
                  <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => setImagePreview(null)}
                  >
                    Remove
                  </Button>
                </div>
              )}

              {/* Manual image URL input */}
              <div>
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imagePreview || ''}
                  onChange={(e) => setImagePreview(e.target.value || null)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Blue Oxford Shirt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as ItemCategory })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ItemStatus })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{STATUS_LABELS.active}</SelectItem>
                  <SelectItem value="wishlist">{STATUS_LABELS.wishlist}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="e.g., Uniqlo"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                placeholder="e.g., Navy Blue"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add to Closet'
            )}
          </Button>
        </motion.form>
      )}
    </div>
  );
}
