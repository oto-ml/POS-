import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { PaymentView } from './views/PaymentView';
import { KitchenView } from './views/KitchenView';
import { OrdersView } from './views/OrdersView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';
import { LoginView } from './views/LoginView';
import { CartItem, MenuItem, ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('POS');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cart Logic
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = () => setCurrentView('PAYMENT');
  const handlePaymentComplete = () => {
    alert('¡Pago completado con éxito!');
    clearCart();
    setCurrentView('POS');
  };

  const handleLogin = () => {
      setCurrentView('POS');
  }

  // Render Logic
  const renderContent = () => {
    switch (currentView) {
      case 'POS':
        return (
          <POSView 
            cart={cart}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            onCheckout={handleCheckout}
          />
        );
      case 'PAYMENT':
        return (
          <PaymentView 
            cart={cart}
            onBack={() => setCurrentView('POS')}
            onComplete={handlePaymentComplete}
          />
        );
      case 'KITCHEN':
        return <KitchenView />;
      case 'ORDERS':
        return <OrdersView />;
      case 'HISTORY':
        return <HistoryView />;
      case 'SETTINGS':
        return <SettingsView />;
      case 'HELP':
        return <HelpView />;
      case 'LOGIN':
        return <LoginView onLogin={handleLogin} />;
      default:
        return <POSView cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} onCheckout={handleCheckout} />;
    }
  };

  if (currentView === 'LOGIN') {
      return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      {renderContent()}
    </div>
  );
};

export default App;