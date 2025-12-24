import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Banknote,
  QrCode,
  ShoppingBag,
  Image,
  Calendar,
  Loader2,
  User as UserIcon,
} from 'lucide-react';
import { Order } from '@/types/menu';
import { auth, db, Timestamp } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    image: string;
    name: string;
  } | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const previousCountRef = useRef<number>(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toLocaleDateString('en-CA')
  );

  // Watch Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore orders only when authenticated
  useEffect(() => {
    if (!authUser) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();

          return {
            id: docSnap.id,
            ...data,
            createdAt,
          } as Order;
        });
        // Detect new orders (only after initial load)
        if (previousCountRef.current && list.length > previousCountRef.current) {
          toast({
            title: 'New order received',
            description: 'A new customer order has been placed.',
          });
        }
        previousCountRef.current = list.length;
        setOrders(list);
        setIsLoading(false);
      },
      () => {
        // In case of error, stop loading state so UI doesn't hang
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser]);

  const updatePaymentStatus = async (orderId: string, status: 'pending' | 'completed') => {
    // Optimistic update
    const previous = orders;
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, paymentStatus: status } : order
      )
    );
    try {
      await updateDoc(doc(db, 'orders', orderId), { paymentStatus: status });
    } catch (error) {
      // Revert and show error (e.g., rules blocking update)
      setOrders(previous);
      toast({
        title: 'Could not update payment status',
        description: 'Please check your Firestore rules and try again.',
        variant: 'destructive',
      });
      console.error('updatePaymentStatus error', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} ${timeStr}`;
  };

  const getDateKey = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-CA');

  const allDateKeys = Array.from(
    new Set([...orders.map((o) => getDateKey(o.createdAt)), selectedDate])
  )
    .filter(Boolean)
    .sort((a, b) => (a < b ? 1 : -1));

  const filteredOrders = orders.filter(
    (o) => getDateKey(o.createdAt) === selectedDate
  );

  const handleNewDayDashboard = () => {
    const todayKey = new Date().toLocaleDateString('en-CA');
    setSelectedDate(todayKey);
    toast({
      title: 'New day started',
      description: `Dashboard reset for ${todayKey}. Previous days are available in history.`,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutDialog(false);
      toast({
        title: 'Logged out',
        description: 'You have been signed out of the admin dashboard.',
      });
    } catch (error) {
      console.error('Logout error', error);
      toast({
        title: 'Logout failed',
        description: 'Something went wrong while logging out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const pendingOrders = filteredOrders.filter((o) => o.paymentStatus === 'pending');
  const completedOrders = filteredOrders.filter((o) => o.paymentStatus === 'completed');
  const cashOrders = filteredOrders.filter((o) => o.paymentMethod === 'cash');
  const onlineOrders = filteredOrders.filter((o) => o.paymentMethod === 'online');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error', error);
      setAuthError('Invalid email or password');
      toast({
        title: 'Login failed',
        description: 'Invalid email or password.',
        variant: 'destructive',
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-display text-2xl font-bold text-primary">
                  Order Dashboard
                </h1>
                <p className="text-sm text-foreground">
                  Garage Chiya
                </p>
              </div>
            </div>
            {authUser && (
              <Popover open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 transition-colors"
                    aria-label="Admin account"
                  >
                    <UserIcon className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-foreground">
                      Signed in as
                    </div>
                    <div className="text-sm font-medium break-all">
                      {authUser.email}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => {
                        setIsProfileOpen(false);
                        setShowLogoutDialog(true);
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </header>

      {/* Auth gate: loading, then login, then dashboard */}
      {authLoading ? (
        <section className="container py-10 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="py-10 flex flex-col items-center gap-3 text-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Checking admin session...</p>
            </CardContent>
          </Card>
        </section>
      ) : !authUser ? (
        <section className="container py-10 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="font-display text-xl">Admin Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Login as Admin'
                  )}
                </Button>
              </form>
              <p className="mt-4 text-xs text-foreground">
               Please enter admin email and password.
              </p>
            </CardContent>
          </Card>
        </section>
      ) : (
        <>

      {/* Stats */}
      <section className="container py-6">
        {/* Date selector / history */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-foreground">
              Showing dashboard for
            </p>
            <p className="font-medium text-sm">
              {selectedDate}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground">History:</span>
            {allDateKeys.map((dateKey) => (
              <Button
                key={dateKey}
                variant={dateKey === selectedDate ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedDate(dateKey)}
              >
                {dateKey}
              </Button>
            ))}
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="ml-1"
              onClick={handleNewDayDashboard}
              title="Start new day dashboard"
            >
              +
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{orders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Pending Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <span className="text-3xl font-bold">{pendingOrders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-success" />
                <span className="text-3xl font-bold">Rs {totalRevenue}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Orders</h2>

          {isLoading && orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading orders from database...</p>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-foreground">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Cash Orders Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    Cash Orders
                  </h3>
                  <span className="text-sm text-foreground">
                    {cashOrders.length} order{cashOrders.length !== 1 && 's'}
                  </span>
                </div>

                {cashOrders.length === 0 ? (
                  <p className="text-sm text-foreground italic">
                    No cash orders yet.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {cashOrders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-secondary/30 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                Table {order.tableNumber}
                              </Badge>
                              <span className="font-semibold">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="gap-1"
                              >
                                <Banknote className="h-3 w-3" />
                                Cash
                              </Badge>
                              <Badge
                                variant={order.paymentStatus === 'pending' ? 'destructive' : 'default'}
                                className={
                                  order.paymentStatus === 'completed'
                                    ? 'bg-success text-success-foreground'
                                    : ''
                                }
                              >
                                {order.paymentStatus === 'pending' ? (
                                  <Clock className="h-3 w-3 mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {order.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>

                            <div className="text-sm text-foreground">
                              📞 {order.phoneNumber}
                            </div>

                            {order.description && (
                              <div className="text-sm bg-muted/50 p-2 rounded">
                                📝 {order.description}
                              </div>
                            )}

                            <div className="border-t pt-3">
                              <p className="text-sm font-medium mb-2">Items:</p>
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                      Rs {item.price * item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                              <div className="text-lg font-bold text-primary">
                                Total: Rs {order.totalAmount}
                              </div>
                              {order.paymentStatus === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => updatePaymentStatus(order.id, 'completed')}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mark as Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Online Orders Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary" />
                    Online Orders
                  </h3>
                  <span className="text-sm text-foreground">
                    {onlineOrders.length} order{onlineOrders.length !== 1 && 's'}
                  </span>
                </div>

                {onlineOrders.length === 0 ? (
                  <p className="text-sm text-foreground italic">
                    No online orders yet.
                  </p>
                ) : (
                  <div className="grid gap-4">
                    {onlineOrders.map((order) => (
                      <Card key={order.id} className="overflow-hidden">
                        <CardHeader className="bg-secondary/30 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                Table {order.tableNumber}
                              </Badge>
                              <span className="font-semibold">{order.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="default"
                                className="gap-1"
                              >
                                <QrCode className="h-3 w-3" />
                                Online
                              </Badge>
                              <Badge
                                variant={order.paymentStatus === 'pending' ? 'destructive' : 'default'}
                                className={
                                  order.paymentStatus === 'completed'
                                    ? 'bg-success text-success-foreground'
                                    : ''
                                }
                              >
                                {order.paymentStatus === 'pending' ? (
                                  <Clock className="h-3 w-3 mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                {order.paymentStatus === 'pending' ? 'Pending' : 'Paid'}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>

                            <div className="text-sm text-foreground">
                              📞 {order.phoneNumber}
                            </div>

                            {order.description && (
                              <div className="text-sm bg-muted/50 p-2 rounded">
                                📝 {order.description}
                              </div>
                            )}

                            {/* Payment Screenshot */}
                            {order.paymentScreenshotUrl && (
                              <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Image className="h-4 w-4 text-success" />
                                    <span className="text-sm font-medium text-success">
                                      Payment proof from: {order.paymentScreenshotName}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedScreenshot({
                                        image: order.paymentScreenshotUrl!,
                                        name: order.paymentScreenshotName || 'Customer',
                                      })
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            )}

                            <div className="border-t pt-3">
                              <p className="text-sm font-medium mb-2">Items:</p>
                              <div className="space-y-1">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between text-sm"
                                  >
                                    <span>
                                      {item.quantity}x {item.name}
                                    </span>
                                    <span className="text-foreground">
                                      Rs {item.price * item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                              <div className="text-lg font-bold text-primary">
                                Total: Rs {order.totalAmount}
                              </div>
                              {order.paymentStatus === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => updatePaymentStatus(order.id, 'completed')}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Mark as Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Screenshot Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Screenshot - {selectedScreenshot?.name}</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <img
              src={selectedScreenshot.image}
              alt="Payment screenshot"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Logout confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of admin dashboard?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Yes, log me out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </div>
  );
};

export default Dashboard;