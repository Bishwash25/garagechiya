import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Banknote,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Image,
  Calendar,
} from 'lucide-react';
import { Order } from '@/types/menu';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    image: string;
    name: string;
  } | null>(null);

  const loadOrders = () => {
    const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    setOrders(storedOrders.reverse());
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const updatePaymentStatus = (orderId: string, status: 'pending' | 'completed') => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, paymentStatus: status } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('orders', JSON.stringify(updatedOrders.reverse()));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeStr}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ` at ${timeStr}`;
    }
  };

  const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending');
  const completedOrders = orders.filter((o) => o.paymentStatus === 'completed');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

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
                <p className="text-sm text-muted-foreground">
                  Burger Chiya Pasal
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={loadOrders} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="container py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
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
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-success" />
                <span className="text-3xl font-bold">रू {totalRevenue}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Recent Orders</h2>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {orders.map((order) => (
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
                          variant={order.paymentMethod === 'cash' ? 'secondary' : 'default'}
                          className="gap-1"
                        >
                          {order.paymentMethod === 'cash' ? (
                            <Banknote className="h-3 w-3" />
                          ) : (
                            <QrCode className="h-3 w-3" />
                          )}
                          {order.paymentMethod === 'cash' ? 'Cash' : 'Online'}
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
                      {/* Order Date */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        📞 {order.phoneNumber}
                      </div>

                      {order.description && (
                        <div className="text-sm bg-muted/50 p-2 rounded">
                          📝 {order.description}
                        </div>
                      )}

                      {/* Payment Screenshot */}
                      {order.paymentScreenshot && (
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
                                  image: order.paymentScreenshot!,
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
                              <span className="text-muted-foreground">
                                रू {item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t">
                        <div className="text-lg font-bold text-primary">
                          Total: रू {order.totalAmount}
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
    </div>
  );
};

export default Dashboard;