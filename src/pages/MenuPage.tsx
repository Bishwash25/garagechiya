import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MenuItemCard from '@/components/MenuItemCard';
import CartSheet from '@/components/CartSheet';
import OrderForm from '@/components/OrderForm';
import { menuItems, categories } from '@/data/menuItems';
import { Order } from '@/types/menu';
import type { CartItem } from '@/types/menu';
import { CartProvider, useCart } from '@/context/CartContext';
import { ArrowLeft, Coffee } from 'lucide-react';

const MenuContent: React.FC = () => {
  const navigate = useNavigate();
  const location = window.location;
  const searchParams = new URLSearchParams(location.search);
  const isCustomerMode = searchParams.get('mode') === 'customer';
  const orderId = searchParams.get('orderId');

  const [activeCategory, setActiveCategory] = useState('All');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [existingOrder, setExistingOrder] = useState<Partial<Order> | null>(null);
  const { setCartItems } = useCart();

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

  // If orderId present, fetch that order and prefill cart with its items
  React.useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const docRef = doc((await import('@/lib/firebase')).db, 'orders', orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<Order>;
          setExistingOrder({ id: snap.id, ...data });
          // Prefill cart with existing items
          if (data.items && Array.isArray(data.items)) {
            setCartItems(data.items as CartItem[]);
            // keep cart closed; admin will open and edit
            setShowOrderForm(false);
            const { toast } = await import('@/hooks/use-toast');
            toast({ title: 'Update mode', description: 'Prefilled cart with existing order items. Add items and proceed to update.' });
          }
        }
      } catch (err) {
        console.error('Could not load order for update', err);
      }
    };

    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                <Coffee className="h-6 w-6" />
                Our Menu
              </h1>
              <p className="text-sm text-foreground">garage chiya</p>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Grid */}
      <section className="container py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard key={item.id} item={item} readOnly={isCustomerMode} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items found in this category</p>
          </div>
        )}
      </section>

      {/* Cart Button */}
      {!isCustomerMode && <CartSheet onCheckout={() => setShowOrderForm(true)} existingOrder={existingOrder} />}

      {/* Order Form Dialog */}
      {!isCustomerMode && (
        <OrderForm
          open={showOrderForm}
          onClose={() => setShowOrderForm(false)}
          existingOrder={existingOrder}
        />
      )}
    </div>
  );
};

const MenuPage: React.FC = () => {
  return (
    <CartProvider>
      <MenuContent />
    </CartProvider>
  );
};

export default MenuPage;
