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
}

// --- IMPORTANTE: Definiciones de Usuario ---
export type UserRole = 'admin' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ViewState = 'POS' | 'PAYMENT' | 'ORDERS' | 'HISTORY' | 'KITCHEN' | 'SETTINGS' | 'HELP' | 'LOGIN';