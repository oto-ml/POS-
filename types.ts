export interface MenuItem {
  id: number;
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
  customerEmail?: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: Date;
  tableNumber?: number;
  type: 'Dine-in' | 'Takeaway' | 'Delivery';
  notes?: string;
}

export interface KitchenTicket extends Order {
  elapsedTime: string; // Mocked for UI
}

export type ViewState = 'POS' | 'PAYMENT' | 'ORDERS' | 'HISTORY' | 'KITCHEN' | 'SETTINGS' | 'HELP' | 'LOGIN';