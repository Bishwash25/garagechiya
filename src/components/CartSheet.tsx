import React, { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Order, CartItem } from '@/types/menu';
import { toast } from '@/hooks/use-toast';

interface CartSheetProps {
  onCheckout: () => void;
  existingOrder?: Partial<Order> | null;
}

const CartSheet: React.FC<CartSheetProps> = ({ onCheckout, existingOrder = null }) => {
  const { cart, updateQuantity, removeFromCart, getTotalAmount, getTotalItems } = useCart();

  // Map of original quantities from existing order (if any)
  const originalQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    if (existingOrder?.items && Array.isArray(existingOrder.items)) {
      (existingOrder.items as CartItem[]).forEach((it) => map.set(it.id, it.quantity || 0));
    }
    return map;
  }, [existingOrder]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 z-50 gap-2 shadow-xl" size="lg">
          <ShoppingCart className="h-5 w-5" />
          <span className="bg-primary-foreground text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            {getTotalItems()}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your Cart</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => {
                const originalQty = originalQtyMap.get(item.id);
                const isNewOrUpdated = originalQty === undefined || item.quantity > originalQty;
                return (
                  <div key={item.id} className="flex items-center gap-4 bg-secondary/50 p-3 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {item.name}{isNewOrUpdated ? ' (new)' : ''}
                      </h4>
                      <p className="text-sm text-muted-foreground">Rs {item.price} each</p>
                    </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const existingQty = originalQtyMap.get(item.id);
                        const newQty = item.quantity - 1;
                        if (existingQty !== undefined && newQty < existingQty) {
                          toast({ title: 'Update mode', description: 'You cannot decrease below the original quantity while updating an order.', variant: 'destructive' });
                          return;
                        }
                        updateQuantity(item.id, newQty);
                      }}
                      disabled={originalQtyMap.get(item.id) !== undefined && item.quantity <= (originalQtyMap.get(item.id) || 0)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-semibold">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (originalQtyMap.get(item.id) !== undefined) {
                        toast({ title: 'Update mode', description: 'Cannot remove original item while updating an order.', variant: 'destructive' });
                        return;
                      }
                      removeFromCart(item.id);
                    }}
                    disabled={originalQtyMap.get(item.id) !== undefined}
                    title={originalQtyMap.get(item.id) !== undefined ? 'Cannot remove original item during update' : 'Remove item'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                );
              })}
            </div>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-primary">Rs {getTotalAmount()}</span>
            </div>
            <Button onClick={onCheckout} className="w-full" size="lg">
              Proceed to Order
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
