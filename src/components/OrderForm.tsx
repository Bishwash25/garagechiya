import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { updateDoc, doc } from 'firebase/firestore';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, QrCode, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db, serverTimestamp } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

import type { Order, CartItem } from '@/types/menu';

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
  existingOrder?: Partial<Order> | null; // when present, we add items to the existing order (update flow)
}

type Step = 'form' | 'payment' | 'screenshot' | 'success';

const OrderForm: React.FC<OrderFormProps> = ({ open, onClose, existingOrder = null }) => {
  const navigate = useNavigate();
  const { cart, getTotalAmount, clearCart } = useCart();
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    tableNumber: '',
    customerName: '',
    phoneNumber: '',
    description: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const [screenshotData, setScreenshotData] = useState({
    name: '',
    screenshot: '',
  });

  // Prefill details when updating an order
  React.useEffect(() => {
    if (existingOrder) {
      setFormData({
        tableNumber: existingOrder.tableNumber?.toString() || '',
        customerName: existingOrder.customerName || '',
        phoneNumber: existingOrder.phoneNumber || '',
        description: existingOrder.description || '',
      });
      // Keep original payment method for reference
      setPaymentMethod(existingOrder.paymentMethod || null);
      // skip payment steps for update flow
      setStep('form');
    }
  }, [existingOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tableNumber || !formData.customerName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (existingOrder) {
      // For update flow, directly add items to existing order without payment
      handleUpdateExistingOrder();
      return;
    }

    setStep('payment');
  };

  const handleUpdateExistingOrder = async () => {
    if (!existingOrder) return;
    if (cart.length === 0) {
      toast({ title: 'Cart empty', description: 'No new items to add', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Merge items: only apply positive differences (delta) between current cart and existing order
      const existingItems: CartItem[] = (existingOrder.items as CartItem[]) || [];
      // clone existing items to avoid mutating original objects
      const merged: CartItem[] = existingItems.map((it) => ({ ...it }));

      // Use a map for quick lookup
      const mergedMap = new Map(merged.map((i) => [i.id, i]));

      let addedTotal = 0;

      cart.forEach((cartItem) => {
        const existing = mergedMap.get(cartItem.id);
        const existingQty = existing?.quantity || 0;
        // Only consider positive additions; ignore quantities that match or are less than existing
        const delta = cartItem.quantity - existingQty;
        if (delta > 0) {
          if (existing) {
            existing.quantity = existingQty + delta; // increases by delta
          } else {
            // brand new item for this order
            merged.push({ ...cartItem });
          }
          addedTotal += cartItem.price * delta;
        }
      });

      const newTotal = (existingOrder.totalAmount || 0) + addedTotal;

      await updateDoc(doc(db, 'orders', existingOrder.id), {
        items: merged,
        totalAmount: newTotal,
        updatedAt: serverTimestamp(),
        orderStatus: 'pending', // reopen order when it's updated so it shows as updated/new
      });

      clearCart();
      toast({ title: 'Order updated', description: 'Items added and order reopened for preparation' });
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Could not update order', error);
      toast({ title: 'Update failed', description: 'Could not add items to order', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSelect = (method: 'cash' | 'online') => {
    setPaymentMethod(method);
    
    if (method === 'online') {
      setStep('screenshot');
    } else {
      saveOrder(method, 'pending');
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotData(prev => ({
          ...prev,
          screenshot: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotData.name || !screenshotData.screenshot) {
      toast({
        title: "Missing information",
        description: "Please enter your name and upload payment screenshot",
        variant: "destructive",
      });
      return;
    }
    saveOrder('online', 'completed', screenshotData.screenshot, screenshotData.name);
  };

  const saveOrder = async (
    method: 'cash' | 'online',
    status: 'pending' | 'completed',
    screenshot?: string,
    screenshotName?: string
  ) => {
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        tableNumber: formData.tableNumber,
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber,
        description: formData.description,
        items: cart,
        totalAmount: getTotalAmount(),
        paymentMethod: method,
        paymentStatus: status,
        orderStatus: 'pending',
        createdAt: serverTimestamp(),
        ...(screenshot && { paymentScreenshotUrl: screenshot }),
        ...(screenshotName && { paymentScreenshotName: screenshotName }),
      });

      setStep('success');
      clearCart();
    } catch (error) {
      toast({
        title: "Could not place order",
        description: "Please try again. If the issue persists, contact support.",
        variant: "destructive",
      });
      console.error('Order save error', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData({ tableNumber: '', customerName: '', phoneNumber: '', description: '' });
    setPaymentMethod(null);
    setScreenshotData({ name: '', screenshot: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {step === 'form' && 'Complete Your Order'}
            {step === 'payment' && 'Select Payment Method'}
            {step === 'screenshot' && 'Upload Payment Proof'}
            {step === 'success' && 'Order Placed!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="tableNumber">Table Number *</Label>
              <Select
                value={formData.tableNumber}
                onValueChange={(value) => setFormData({ ...formData, tableNumber: value })}
                disabled={!!existingOrder}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table number" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Table {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter your name"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
                disabled={!!existingOrder}
              />
            </div>
            
            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                maxLength={10}
                disabled={!!existingOrder}
              />
            </div>
            
            <div>
              <Label htmlFor="description">Special Instructions (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Any special requests..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={!!existingOrder}
              />
            </div>

            {existingOrder && (
              <p className="text-sm text-muted-foreground">⚠️ Update mode: order details are locked and cannot be changed.</p>
            )}

            <div className="bg-secondary/50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Order Total</p>
              <p className="text-2xl font-bold text-primary">Rs {getTotalAmount()}</p>
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {existingOrder ? 'Add items to order' : 'Continue to Payment'}
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Total: <span className="font-bold text-primary">Rs {getTotalAmount()}</span></p>
            
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 "
                onClick={() => handlePaymentSelect('cash')}
                disabled={submitting}
              >
                <Banknote className="h-6 w-6" />
                <span>Pay After</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 "
                onClick={() => handlePaymentSelect('online')}
                disabled={submitting}
              >
                <QrCode className="h-6 w-6" />
                <span>Pay Before</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'screenshot' && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Scan QR to Pay</p>
               
              <div className="w-48 h-48 bg-card border-2 border-dashed border-border mx-auto flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center p-2">
                  <img
    src="/image/QR.jpeg"   // path to your QR image
    alt="Payment QR Code"
    className="mx-auto w-40 h-40 object-contain rounded-md"
  />
                </p>
              </div>
              <p className="mt-2 font-semibold text-center">Amount: Rs {getTotalAmount()}</p>
            </div>

            <form onSubmit={handleScreenshotSubmit} className="space-y-4">
              <div>
                <Label htmlFor="payerName">Your Name *</Label>
                <Input
                  id="payerName"
                  placeholder="Enter the name used for payment"
                  value={screenshotData.name}
                  onChange={(e) => setScreenshotData({ ...screenshotData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="screenshot">Payment Screenshot *</Label>
                <div className="mt-2">
                  {screenshotData.screenshot ? (
                    <div className="relative">
                      <img
                        src={screenshotData.screenshot}
                        alt="Payment screenshot"
                        className="w-full max-h-48 object-contain rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setScreenshotData({ ...screenshotData, screenshot: '' })}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Click to upload screenshot</span>
                      <input
                        type="file"
                        id="screenshot"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotUpload}
                      />
                    </label>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Payment
                  </>
                )}
              </Button>
            </form>
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
                  Please pay cash when your order arrives.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h3 className="text-xl font-semibold">Payment Confirmed!</h3>
                <p className="text-muted-foreground">
                  Your payment has been submitted for verification.
                </p>
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