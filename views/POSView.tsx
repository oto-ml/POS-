import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface POSViewProps {
  cart: CartItem[];
  addToCart: (item: MenuItem, options?: { extras?: Array<{ id?: string; name: string; price?: number }>; notes?: string; quantity?: number }) => void;
  // IMPORTANTE: Cambiamos los IDs de number a string o any para compatibilidad con Firebase
  updateQuantity: (itemId: any, delta: number) => void;
  removeFromCart: (itemId: any) => void;
  clearCart: () => void;
  onCheckout: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ 
  cart, 
  addToCart, 
  updateQuantity, 
  clearCart,
  onCheckout
}) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para manejar la carga de datos de Firebase
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Opciones de extras/salsas (puedes mover a la BD si lo prefieres)
  const EXTRA_OPTIONS: Array<{ id: string; name: string; price?: number }> = [
    { id: 'ex1', name: 'Salsa Roja', price: 0.5 },
    { id: 'ex2', name: 'Salsa Verde', price: 0.5 },
    { id: 'ex3', name: 'Extra Queso', price: 1.0 },
    { id: 'ex4', name: 'Extra Pico', price: 0.75 },
  ];

  // Estado y helpers para el modal de personalización
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id?: string; name: string; price?: number }>>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const openCustomize = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
  };

  const toggleExtra = (ex: { id?: string; name: string; price?: number }) => {
    setSelectedExtras(prev => {
      if (prev.some(p => p.id === ex.id)) {
        return prev.filter(p => p.id !== ex.id);
      }
      return [...prev, ex];
    });
  };

  const handleConfirmAdd = () => {
    if (!selectedItem) return;
    addToCart(selectedItem, { extras: selectedExtras, notes, quantity });
    setSelectedItem(null);
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
  };

  // Categorías fijas (podrías también traerlas de la BD si quisieras)
  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Todos'];

  // EFECTO: Cargar productos desde Firebase al iniciar
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id, // Usamos el ID generado por Firebase
          ...doc.data()
        })) as MenuItem[];
        
        setProducts(productsList);
      } catch (error) {
        console.error("Error conectando con Firebase:", error);
        alert("Error cargando el menú. Revisa tu conexión.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Lógica de filtrado (ahora usa 'products' en lugar de 'MENU_ITEMS')
  const filteredItems = products.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cálculos del carrito
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) + (item.extras ? item.extras.reduce((s, ex) => s + (ex.price || 0) * (item.quantity || 1), 0) : 0), 0);
  const tax = subtotal * 0.16; // IVA 16%
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background-dark text-white">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p>Cargando menú desde la nube...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-full flex-1 overflow-hidden">
      {/* Panel Izquierdo: Selección de Menú */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background-dark">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#22492f]/50 p-6">
          <div className="flex flex-col">
            <h1 className="text-white text-3xl font-black tracking-[-0.033em]">Selección de Artículos</h1>
            <p className="text-secondary text-base font-normal"></p>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-[#22492f]" 
              style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Cajero&background=25f46a&color=000")' }}
            ></div>
            <div className="hidden md:flex flex-col text-right">
              <h2 className="text-white text-base font-medium">Caja</h2>
              <p className="text-secondary text-sm">Activo</p>
            </div>
          </div>
        </header>

        {/* Contenido: Buscador y Tabs */}
        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4">
                {/* Buscador */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input 
                        type="text"
                        className="w-full bg-[#183422] border-none rounded-xl py-3 pl-12 pr-4 text-white placeholder-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="Buscar por nombre de artículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categorías */}
                <div className="flex gap-8 overflow-x-auto border-b border-[#316843] no-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`pb-3 pt-2 text-sm font-bold tracking-[0.015em] whitespace-nowrap border-b-[3px] transition-colors ${
                                activeCategory === cat 
                                    ? 'border-primary text-white' 
                                    : 'border-transparent text-secondary hover:text-white'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Productos */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-secondary opacity-70">
                    <p>No se encontraron productos en esta categoría.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map(item => {
                          // 1. Calculamos el stock de forma segura
                          const currentStock = item.stock ?? 0;
                          const isOutOfStock = currentStock <= 0;

                          return (
                            <div 
                              key={item.id}
                              onClick={() => {
                                // 2. Bloquear el click si no hay stock
                                if (isOutOfStock) return;
                                openCustomize(item);
                              }}
                              className={`relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 transition-transform ${
                                isOutOfStock 
                                  ? 'cursor-not-allowed opacity-50 grayscale-[0.5]' 
                                  : 'cursor-pointer hover:scale-[1.02] hover:bg-[#22492f] border border-transparent hover:border-primary/30'
                              }`}
                            >
                                <div 
                                    className="aspect-square w-full rounded-lg bg-cover bg-center bg-gray-700" 
                                    style={{ backgroundImage: `url('${item.image || 'https://placehold.co/200x200/102316/FFF?text=Sin+Imagen'}')` }}
                                ></div>
                                
                                {/* 3. Indicador de Agotado mejorado */}
                                {isOutOfStock && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg pointer-events-none z-10">
                                    <span className="bg-red-600 text-white px-3 py-1 rounded font-bold border border-red-400 shadow-lg transform -rotate-12">
                                      AGOTADO
                                    </span>
                                  </div>
                                )}

                                <div className="flex flex-col">
                                    <p className="text-base font-bold text-white leading-tight line-clamp-2">{item.name}</p>
                                    <div className="flex justify-between items-center mt-1">
                                      <p className="text-sm text-primary font-mono">${item.price.toFixed(2)}</p>
                                      {/* Mostrar aviso de stock bajo si no está agotado */}
                                      {!isOutOfStock && currentStock < 10 && (
                                         <span className="text-[10px] text-orange-400 font-bold">¡Solo {currentStock}!</span>
                                      )}
                                    </div>
                                </div>
                            </div>
                          );
                        })}
                  </div>
                )}
            </div>
        </div>
      </div>

      {/* Modal de personalización */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-[#183422] rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">Personalizar: {selectedItem.name}</h3>
            <p className="text-sm text-secondary mb-4">Selecciona salsas/extras y añade notas</p>

            <div className="mb-3">
              <label className="block text-sm text-white font-bold mb-2">Extras</label>
              <div className="grid grid-cols-2 gap-2">
                {EXTRA_OPTIONS.map(ex => (
                  <label key={ex.id} className="flex items-center gap-2 text-white">
                    <input type="checkbox" checked={selectedExtras.some(e => e.id === ex.id)} onChange={() => toggleExtra(ex)} />
                    <span className="text-sm">{ex.name} {ex.price ? `(+$${ex.price.toFixed(2)})` : ''}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-white font-bold mb-2">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#102216] rounded p-2 text-white" placeholder="Ej: Sin cebolla, extra picante..." />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="text-sm text-white font-bold">Cantidad</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-1 bg-[#102216] rounded">-</button>
                <span className="px-3 text-white font-bold">{quantity}</span>
                <button onClick={() => setQuantity(q => {
                  // Respetar el stock máximo al incrementar cantidad
                  const max = selectedItem?.stock ?? 9999;
                  return Math.min(max, q + 1);
                })} className="px-3 py-1 bg-[#102216] rounded">+</button>
              </div>
            </div>

            {/* Mostrar stock disponible si viene en el producto */}
            {selectedItem && typeof (selectedItem as any).stock !== 'undefined' && (
              <div className="mb-3">
                {(selectedItem as any).stock > 0 ? (
                  <p className="text-sm text-secondary">Stock disponible: {(selectedItem as any).stock}</p>
                ) : (
                  <p className="text-sm text-red-400 font-bold">Agotado</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setSelectedItem(null); setSelectedExtras([]); setNotes(''); setQuantity(1); }} 
                className="px-4 py-2 bg-transparent text-white border rounded"
              >
                Cancelar
              </button>
              
              <button 
                onClick={() => { handleConfirmAdd(); }} 
                // 4. Deshabilitar botón si el stock es 0 o menor
                disabled={!selectedItem || (selectedItem.stock ?? 0) <= 0} 
                className="px-4 py-2 bg-primary text-background-dark rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {(!selectedItem || (selectedItem.stock ?? 0) > 0) ? 'Agregar al pedido' : 'Sin Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Derecho: Carrito Actual */}
      <div className="hidden lg:flex w-[400px] flex-col border-l border-[#22492f]/50 bg-[#142d1c]">
        <header className="flex items-center justify-between p-6 bg-[#102316]">
          <h3 className="text-2xl font-bold text-white">Pedido Actual</h3>
          <button 
            onClick={clearCart}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
            Vaciar
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">shopping_cart_off</span>
                    <p>El carrito está vacío</p>
                    <p className="text-sm mt-2">Selecciona productos a la izquierda</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl bg-background-dark p-3 border border-white/5 shadow-sm">
                        <div 
                           className="size-16 rounded-lg bg-cover bg-center bg-gray-800 shrink-0"
                           style={{ backgroundImage: `url('${item.image || ''}')` }} 
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <p className="text-xs text-secondary italic">{item.notes || 'Sin notas'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-2 bg-[#22492f] rounded-lg p-0.5">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                    className="size-7 flex items-center justify-center text-white hover:bg-white/10 rounded font-bold"
                                >-</button>
                                <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                    className="size-7 flex items-center justify-center text-white hover:bg-white/10 rounded font-bold"
                                >+</button>
                            </div>
                            <p className="font-bold text-white font-mono">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Resumen Financiero */}
        <div className="border-t border-[#22492f]/50 bg-[#0d1c12] p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-base">
              <p className="text-secondary">Subtotal</p>
              <p className="font-medium text-white">${subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-base">
              <p className="text-secondary">IVA (16%)</p>
              <p className="font-medium text-white">${tax.toFixed(2)}</p>
            </div>
            <div className="my-2 border-t border-dashed border-[#22492f]"></div>
            <div className="flex justify-between text-xl">
              <p className="font-bold text-white">Total</p>
              <p className="font-black text-primary text-2xl">${total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-background-dark hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              Pagar e Imprimir
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};