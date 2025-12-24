import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, QrCode, CheckCircle, Clock, Upload, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { db, serverTimestamp } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';

interface OrderFormProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'form' | 'payment' | 'screenshot' | 'success';

const OrderForm: React.FC<OrderFormProps> = ({ open, onClose }) => {
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
              <p className="text-2xl font-bold text-primary">Rs {getTotalAmount()}</p>
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              Continue to Payment
            </Button>
          </form>
        )}

        {step === 'payment' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">Total: <span className="font-bold text-primary">Rs {getTotalAmount()}</span></p>
            
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handlePaymentSelect('cash')}
                disabled={submitting}
              >
                <Banknote className="h-6 w-6" />
                <span>Pay with Cash</span>
              </Button>
              
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => handlePaymentSelect('online')}
                disabled={submitting}
              >
                <QrCode className="h-6 w-6" />
                <span>Pay Online (QR)</span>
              </Button>
            </div>
          </div>
        )}

        {step === 'screenshot' && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Scan QR to Pay</p>
              {/* 
                TODO: Replace this with actual payment QR code
                You can add your eSewa/Khalti/Bank QR code image here
              */}
              <div className="w-48 h-48 bg-card border-2 border-dashed border-border mx-auto flex items-center justify-center">
                <p className="text-xs text-muted-foreground text-center p-2">
                  [Payment QR Code will be displayed here]
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