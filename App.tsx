import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { PaymentView } from './views/PaymentView';
import { KitchenView } from './views/KitchenView';
import { CookDashboardView } from './views/CookDashboardView';
import { InventoryView } from './views/InventoryView';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { HelpView } from './views/HelpView';
import { LoginView } from './views/LoginView';
import { OrdersView } from './views/OrdersView';
import { CartItem, MenuItem, ViewState, UserProfile } from './types';

import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('POS');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoadingAuth(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            if (currentView === 'LOGIN') setCurrentView('POS');
          } else {
            await signOut(auth);
            setUser(null);
            alert("Acceso denegado.");
          }
        } catch (error) {
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [currentView]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setCart([]);
        setUser(null);
    } catch (error) { console.error(error); }
  };

  // --- LÓGICA DEL CARRITO ACTUALIZADA ---

  const addToCart = (item: MenuItem, options?: { extras?: any[]; notes?: string; quantity?: number }) => {
    const quantityToAdd = options?.quantity ?? 1;
    
    setCart(prev => {
      // Buscar si ya existe un item idéntico (mismo producto + mismos extras + mismas notas)
      const matchIndex = prev.findIndex(i => {
        if (i.id !== item.id) return false;
        const aExtras = JSON.stringify((i.extras || []).sort((a:any,b:any) => a.id.localeCompare(b.id)));
        const bExtras = JSON.stringify((options?.extras || []).sort((a:any,b:any) => a.id.localeCompare(b.id)));
        return aExtras === bExtras && (i.notes || '') === (options?.notes || '');
      });

      if (matchIndex !== -1) {
        // Si existe, solo actualizamos la cantidad
        const updated = [...prev];
        updated[matchIndex] = { ...updated[matchIndex], quantity: updated[matchIndex].quantity + quantityToAdd };
        return updated;
      }

      // Si no existe, creamos uno nuevo con un internalId único
      const newItem: CartItem = {
        ...item,
        internalId: crypto.randomUUID(), // Generamos ID único para el carrito
        quantity: quantityToAdd,
        notes: options?.notes,
        extras: options?.extras
      };
      return [...prev, newItem];
    });
  };

  // Actualizar cantidad usando internalId
  const updateQuantity = (internalId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.internalId === internalId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Eliminar usando internalId (solo elimina esa línea específica)
  const removeFromCart = (internalId: string) => {
    setCart(prev => prev.filter(i => i.internalId !== internalId));
  };

  // Nueva función: Editar un item existente
  const editCartItem = (internalId: string, updates: { extras?: any[]; notes?: string; quantity?: number }) => {
    setCart(prev => prev.map(item => {
        if (item.internalId === internalId) {
            return { ...item, ...updates };
        }
        return item;
    }));
  };

  const clearCart = () => setCart([]);
  const handleCheckout = () => setCurrentView('PAYMENT');
  const handlePaymentComplete = () => {
    alert('¡Pago registrado correctamente!');
    clearCart();
    setCurrentView('POS');
  };

  const handleLogin = () => {};

  if (loadingAuth) return <div className="h-screen w-full bg-[#0d1c12] flex items-center justify-center text-white">Cargando...</div>;
  if (!user) return <LoginView onLogin={handleLogin} />;

  if (user.role === 'cook') {
    return (
      <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden">
        <Sidebar currentView={currentView} onChangeView={setCurrentView} userRole={user.role} user={user} onLogout={handleLogout} />
        <CookDashboardView />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'POS': return <POSView 
                            cart={cart} 
                            addToCart={addToCart} 
                            updateQuantity={updateQuantity} 
                            removeFromCart={removeFromCart} 
                            editCartItem={editCartItem} // Pasamos la nueva función
                            clearCart={clearCart} 
                            onCheckout={handleCheckout} 
                          />;
      case 'PAYMENT': return <PaymentView cart={cart} onBack={() => setCurrentView('POS')} onComplete={handlePaymentComplete} />;
      case 'KITCHEN': return <KitchenView />;
      case 'INVENTORY': return <InventoryView userRole={user?.role} />;
      case 'HISTORY': return <HistoryView />;
      case 'SETTINGS': return <SettingsView userRole={user?.role} />;
      case 'ORDERS': return <OrdersView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} userRole={user.role} user={user} onLogout={handleLogout} />
      {renderContent()}
    </div>
  );
};

export default App;