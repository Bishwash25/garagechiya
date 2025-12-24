import React, { useState } from 'react';
import { MenuItem } from '@/types/menu';
import { Button } from '@/components/ui/button';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from '@/hooks/use-toast';

interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(item, quantity);
    toast({
      title: "Added to cart!",
      description: `${quantity}x ${item.name} added`,
      duration: 1000,
    });
    setQuantity(1);
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 border border-border/50 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">{item.name}</h3>
          {item.nameNp && (
            <p className="text-sm text-muted-foreground">{item.nameNp}</p>
          )}
        </div>
        <span className="text-primary font-bold text-lg">Rs {item.price}</span>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setQuantity(quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={handleAddToCart} size="sm" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
};

export default MenuItemCard;
