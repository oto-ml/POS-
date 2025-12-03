export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  sku?: string;
  stock?: number;
}

export interface CartItem extends MenuItem {
  internalId: string; // Nuevo: ID único para identificar esta línea específica en el carrito
  quantity: number;
  notes?: string;
  extras?: Array<{ id?: string; name: string; price?: number }>;
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
  updatedAt?: any;
  subtotal?: number;
  tax?: number;
  receivedAmount?: number;
  change?: number;
  paymentDetails?: { last4?: string };
}

export type UserRole = 'admin' | 'cashier' | 'cook';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ViewState = 'POS' | 'PAYMENT' | 'INVENTORY' | 'HISTORY' | 'KITCHEN' | 'SETTINGS' | 'HELP' | 'LOGIN' | 'ORDERS';