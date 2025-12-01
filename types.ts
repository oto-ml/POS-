export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

export enum OrderStatus {
  PREPARING = 'Preparando',
  READY = 'Listo',
  DELIVERED = 'Entregado',
  PENDING = 'Pendiente',
  COMPLETED = 'Completado',
  CANCELLED = 'Cancelado'
}

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: any;
  tableNumber?: number;
  type: 'Dine-in' | 'Takeaway' | 'Delivery';
  paymentMethod?: 'cash' | 'card';
  createdAt?: any;
  subtotal?: number;
  tax?: number;
  receivedAmount?: number;
  change?: number;
  paymentDetails?: { last4?: string };
}

export type UserRole = 'admin' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

// Vista INVENTORY añadida para la gestión del menú
export type ViewState = 'POS' | 'PAYMENT' | 'INVENTORY' | 'HISTORY' | 'KITCHEN' | 'SETTINGS' | 'HELP' | 'LOGIN';