import { useState, useEffect } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { useClosetItems } from '@/hooks/useClosetItems';
import { 
  ClosetItem, 
  ItemCategory, 
  ItemStatus, 
  CATEGORY_LABELS, 
  STATUS_LABELS,
  ArchiveReason,
  ARCHIVE_REASON_LABELS
} from '@/types/closet';

interface EditItemDialogProps {
  item: ClosetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const { toast } = useToast();
  const { updateItem, deleteItem, archiveItem } = useClosetItems();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'tops' as ItemCategory,
    brand: '',
    color: '',
    status: 'active' as ItemStatus,
    productUrl: '',
  });

  // Sync form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        brand: item.brand || '',
        color: item.color || '',
        status: item.status,
        productUrl: item.product_url || '',
      });
      setImagePreview(item.image_url || null);
    }
  }, [item]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !formData.name) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await updateItem(item.id, {
        name: formData.name,
        category: formData.category,
        brand: formData.brand || undefined,
        color: formData.color || undefined,
        status: formData.status,
        image_url: imagePreview || undefined,
        product_url: formData.productUrl || undefined,
      });

      toast({ title: 'Item updated successfully!' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error updating item', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      await deleteItem(item.id);
      toast({ title: 'Item deleted' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error deleting item', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (reason: ArchiveReason) => {
    if (!item) return;
    
    setLoading(true);
    try {
      await archiveItem(item.id, reason);
      toast({ title: 'Item archived' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error archiving item', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Preview */}
          <div>
            <Label>Image</Label>
            <div className="mt-2">
              {imagePreview ? (
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary max-h-48">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => document.getElementById('edit-image-upload')?.click()}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="block aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <input
                    id="edit-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground py-8">
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm">Add image</span>
                  </div>
                </label>
              )}
              <input
                id="edit-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              placeholder="e.g., Blue Oxford Shirt"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1"
              required
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-category">Category</Label>
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
              <Label htmlFor="edit-status">Status</Label>
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
                  <SelectItem value="archived">{STATUS_LABELS.archived}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Brand & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                placeholder="e.g., Uniqlo"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                placeholder="e.g., Navy Blue"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <div className="flex gap-2 w-full sm:w-auto">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{item.name}" from your closet.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {formData.status !== 'archived' && (
                <Select value="" onValueChange={(value) => handleArchive(value as ArchiveReason)}>
                  <SelectTrigger className="w-auto">
                    <span className="text-sm text-muted-foreground">Archive...</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ARCHIVE_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
