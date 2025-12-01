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
import { CartItem, MenuItem, ViewState, UserProfile } from './types';

// Importaciones de Firebase
import { auth, db } from './firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('POS');
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Estado de Usuario y Carga
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // --- 1. ESCUCHA DE SESIÓN (Auth Listener) ---
  useEffect(() => {
    if (!auth) {
        console.error("Firebase Auth no está inicializado.");
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
            
            // Si es cocinero, por defecto va a su cocina, pero permitimos navegación
            if (userData.role === 'cook' && currentView === 'POS') {
               setCurrentView('KITCHEN');
            }
          } else {
            console.warn("Acceso denegado: Usuario sin perfil activo.");
            await signOut(auth);
            setUser(null);
            alert("Acceso denegado: Esta cuenta ha sido desactivada o eliminada.");
          }
        } catch (error) {
          console.error("Error validando usuario:", error);
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [currentView]); // Agregamos currentView como dependencia

  // --- 2. FUNCIÓN DE CERRAR SESIÓN (Logout) ---
  const handleLogout = async () => {
    console.log("Cerrando sesión...");
    try {
        await signOut(auth);
        setCart([]);
        setUser(null);
    } catch (error) {
        console.error("Error al salir:", error);
        alert("Error al cerrar sesión. Revisa tu conexión.");
    }
  };

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (item: MenuItem, options?: { extras?: Array<{ id?: string; name: string; price?: number }>; notes?: string; quantity?: number }) => {
    const quantityToAdd = options?.quantity ?? 1;
    setCart(prev => {
      const matchIndex = prev.findIndex(i => {
        if (i.id !== item.id) return false;
        const aExtras = JSON.stringify((i as any).extras || []);
        const bExtras = JSON.stringify(options?.extras || []);
        const aNotes = (i as any).notes || '';
        const bNotes = options?.notes || '';
        return aExtras === bExtras && aNotes === bNotes;
      });

      if (matchIndex !== -1) {
        const updated = [...prev];
        updated[matchIndex] = { ...updated[matchIndex], quantity: updated[matchIndex].quantity + quantityToAdd } as any;
        return updated;
      }

      return [...prev, { ...item, quantity: quantityToAdd, notes: options?.notes, extras: options?.extras } as any];
    });
  };

  const updateQuantity = (itemId: string | number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (itemId: string | number) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => setCart([]);
  const handleCheckout = () => setCurrentView('PAYMENT');
  const handlePaymentComplete = () => {
    alert('¡Pago registrado correctamente!');
    clearCart();
    setCurrentView('POS');
  };

  const handleLogin = () => {};

  // --- RENDERIZADO ---
  
  if (loadingAuth) {
      return (
        <div className="h-screen w-full bg-[#0d1c12] flex flex-col items-center justify-center text-white gap-4">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            <p>Verificando credenciales...</p>
        </div>
      );
  }

  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'POS': return <POSView cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} onCheckout={handleCheckout} />;
      case 'PAYMENT': return <PaymentView cart={cart} onBack={() => setCurrentView('POS')} onComplete={handlePaymentComplete} />;
      
      // LÓGICA CORREGIDA: Si es cocinero muestra su dashboard, si no muestra la vista normal
      case 'KITCHEN': 
        return user.role === 'cook' ? <CookDashboardView /> : <KitchenView />;
      
      case 'INVENTORY': return <InventoryView userRole={user?.role} />;
      case 'HISTORY': return <HistoryView />;
      case 'SETTINGS': return <SettingsView userRole={user?.role} />;
      case 'HELP': return <HelpView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-dark text-white font-display overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={user.role}
        user={user}
        onLogout={handleLogout} 
      />
      {renderContent()}
    </div>
  );
};

export default App;