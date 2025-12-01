import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { PaymentView } from './views/PaymentView';
import { KitchenView } from './views/KitchenView';
import { OrdersView } from './views/OrdersView';
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
    // Verificación de seguridad por si firebase.ts falló
    if (!auth) {
        console.error("Firebase Auth no está inicializado.");
        setLoadingAuth(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Si hay usuario autenticado, verificamos si tiene PERMISO en la BD
          // Esta es la parte CLAVE para la seguridad:
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            // ✅ El usuario existe y tiene perfil activo
            const userData = userDoc.data() as UserProfile;
            setUser(userData);
            // Si estaba en login, lo mandamos al POS
            if (currentView === 'LOGIN') setCurrentView('POS');
          } else {
            // ❌ El usuario existe en Auth pero FUE ELIMINADO de la BD
            console.warn("Acceso denegado: Usuario sin perfil activo.");
            await signOut(auth); // Lo desconectamos forzosamente
            setUser(null);
            alert("Acceso denegado: Esta cuenta ha sido desactivada o eliminada.");
          }
        } catch (error) {
          console.error("Error validando usuario:", error);
          // En caso de error de red, cerramos sesión por seguridad para no dejarlo en el limbo
          await signOut(auth);
          setUser(null);
        }
      } else {
        // Usuario desconectado
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
        await signOut(auth); // Desconecta de Firebase
        setCart([]);         // Limpia el carrito por seguridad
        setUser(null);       // Fuerza el estado a null
        // La redirección a Login la maneja el renderizado condicional abajo
    } catch (error) {
        console.error("Error al salir:", error);
        alert("Error al cerrar sesión. Revisa tu conexión.");
    }
  };

  // --- LÓGICA DEL CARRITO ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
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

  // Función dummy para pasar al LoginView
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

  // Si no hay usuario autenticado, mostramos Login
  if (!user) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'POS': return <POSView cart={cart} addToCart={addToCart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} clearCart={clearCart} onCheckout={handleCheckout} />;
      case 'PAYMENT': return <PaymentView cart={cart} onBack={() => setCurrentView('POS')} onComplete={handlePaymentComplete} />;
      case 'KITCHEN': return <KitchenView />;
      case 'ORDERS': return <OrdersView />;
      case 'HISTORY': return <HistoryView />;
      case 'SETTINGS': return <SettingsView />;
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
        onLogout={handleLogout} 
      />
      {renderContent()}
    </div>
  );
};

export default App;