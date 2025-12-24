import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MenuItemCard from '@/components/MenuItemCard';
import CartSheet from '@/components/CartSheet';
import OrderForm from '@/components/OrderForm';
import { menuItems, categories } from '@/data/menuItems';
import { CartProvider } from '@/context/CartContext';
import { ArrowLeft, Coffee } from 'lucide-react';

const MenuContent: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showOrderForm, setShowOrderForm] = useState(false);

  const filteredItems = activeCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === activeCategory);

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
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items found in this category</p>
          </div>
        )}
      </section>

      {/* Cart Button */}
      <CartSheet onCheckout={() => setShowOrderForm(true)} />

      {/* Order Form Dialog */}
      <OrderForm open={showOrderForm} onClose={() => setShowOrderForm(false)} />
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
