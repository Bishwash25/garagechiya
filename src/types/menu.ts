export interface MenuItem {
  id: string;
  name: string;
  nameNp?: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  phoneNumber: string;
  description?: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: 'cash' | 'online';
  paymentStatus: 'pending' | 'completed';
  orderStatus: 'pending' | 'preparing' | 'ready' | 'completed';
  createdAt: string;
  paymentScreenshotName?: string;
  paymentScreenshotUrl?: string;
}
