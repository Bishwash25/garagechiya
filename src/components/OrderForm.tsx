import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, QrCode, CheckCircle, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'payment' | 'success';

const OrderForm: React.FC<OrderFormProps> = ({ open, onClose }) => {
  const { cart, getTotalAmount, clearCart } = useCart();
  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    tableNumber: '',
    customerName: '',
    phoneNumber: '',
    description: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tableNumber || !formData.customerName || !formData.phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    setStep('payment');
  };

  const handlePaymentSelect = (method: 'cash' | 'online') => {
    setPaymentMethod(method);
    
    // Here you would typically save the order to the database
    const order = {
      ...formData,
      items: cart,
      totalAmount: getTotalAmount(),
      paymentMethod: method,
      paymentStatus: method === 'cash' ? 'pending' : 'pending',
      createdAt: new Date(),
    };
    
    console.log('Order created:', order);
    
    // For now, store in localStorage (will be replaced with database)
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push({ ...order, id: Date.now().toString() });
    localStorage.setItem('orders', JSON.stringify(orders));
    
    setStep('success');
    clearCart();
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ tableNumber: '', customerName: '', phoneNumber: '', description: '' });
    setPaymentMethod(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 'form' && 'Complete Your Order'}
            {step === 'payment' && 'Select Payment Method'}
            {step === 'success' && 'Order Placed!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tableNumber">Table Number *</Label>
              <Input
                id="tableNumber"
                placeholder="Enter table number"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter your name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Special Instructions (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any special requests..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            
            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-2xl font-bold text-primary">रू {getTotalAmount()}</p>
            </div>
            
            <Button type="submit" className="w-full" size="lg">
              Continue to Payment
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Total: <span className="font-bold text-primary">रू {getTotalAmount()}</span></p>
            
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handlePaymentSelect('cash')}
              >
                <Banknote className="h-6 w-6" />
                <span>Pay with Cash</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handlePaymentSelect('online')}
              >
                <QrCode className="h-6 w-6" />
                <span>Pay Online (QR)</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            {paymentMethod === 'cash' ? (
              <>
                <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-10 w-10 text-warning" />
                </div>
                <h3 className="text-xl font-semibold">Payment Pending</h3>
                <p className="text-muted-foreground">
                  Please pay रू {getTotalAmount()} in cash when your order arrives.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                  <QrCode className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Scan to Pay</h3>
                {/* 
                  TODO: Replace this with actual payment QR code
                  You can add your eSewa/Khalti/Bank QR code image here
                */}
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Payment QR Code</p>
                  <div className="w-48 h-48 bg-card border-2 border-dashed border-border mx-auto flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center p-2">
                      [Payment QR Code will be displayed here]
                    </p>
                  </div>
                  <p className="mt-2 font-semibold">Amount: रू {getTotalAmount()}</p>
                </div>
              </>
            )}
            
            <div className="bg-success/10 p-3 rounded-lg">
              <div className="flex items-center gap-2 justify-center text-success">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Order Confirmed!</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Table {formData.tableNumber} • {formData.customerName}
              </p>
            </div>
            
            <Button onClick={handleClose} className="w-full" size="lg">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
