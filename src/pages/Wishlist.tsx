import { motion } from 'framer-motion';
import { Plus, ExternalLink, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ItemCard } from '@/components/closet/ItemCard';
import { useClosetItems } from '@/hooks/useClosetItems';

export default function WishlistPage() {
  const { items, loading } = useClosetItems();
  const wishlistItems = items.filter(item => item.status === 'wishlist');

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <h1 className="section-header mb-2">Wishlist</h1>
        <p className="text-muted-foreground text-sm">
          Items you're dreaming about
        </p>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="item-card bg-secondary animate-pulse" />
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary flex items-center justify-center">
              <Heart className="w-8 h-8 text-foreground" />
            </div>
            <h3 className="font-medium mb-2">Your wishlist is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add items you'd love to own and try them on virtually
            </p>
            <Button asChild>
              <Link to="/closet/add">Add to Wishlist</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.div 
              layout
              className="grid grid-cols-2 gap-3"
            >
              {wishlistItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard
                    item={item}
                    onClick={() => {}}
                  />
                  {item.product_url && (
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-12 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-soft"
                    >
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </a>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Summary Card */}
            <div className="bg-card rounded-xl p-4 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Wishlist Summary</h3>
                <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} on your wishlist
              </p>
              <p className="text-2xl font-serif font-semibold">
                ${wishlistItems.reduce((sum, item) => sum + (item.purchase_price || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total estimated value</p>
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link to="/closet/add" className="fab">
        <Plus className="w-6 h-6" />
      </Link>
    </div>
  );
}
