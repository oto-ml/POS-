import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface POSViewProps {
  cart: CartItem[];
  addToCart: (item: MenuItem, options?: { extras?: Array<{ id?: string; name: string; price?: number }>; notes?: string; quantity?: number }) => void;
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
  
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- LÓGICA DE PERSONALIZACIÓN DINÁMICA ---
  const getCategoryOptions = (category: string): Array<{ id: string; name: string; price: number }> => {
    switch (category) {
      case 'Platos Fuertes':
        return [
          { id: 'pf-ketchup', name: 'Ketchup', price: 0 },
          { id: 'pf-mostaza', name: 'Mostaza', price: 0 },
          { id: 'pf-mayonesa', name: 'Mayonesa', price: 0 },
          { id: 'pf-queso', name: 'Queso', price: 10.0 },
          { id: 'pf-bbq', name: 'BBQ', price: 5.0 },
          { id: 'pf-mango', name: 'Mango', price: 5.0 },
          { id: 'pf-habanero', name: 'Habanero', price: 5.0 },
          { id: 'pf-lemon', name: 'Lemon Pepper', price: 0 },
        ];
      case 'Entradas':
        return [
          { id: 'ent-ketchup', name: 'Ketchup', price: 0 },
          { id: 'ent-quesoliq', name: 'Queso Líquido', price: 15.0 },
          { id: 'ent-salsa', name: 'Salsa', price: 5.0 },
        ];
      case 'Bebidas':
        return [
          { id: 'beb-fria', name: 'Fría', price: 0 },
          { id: 'beb-temp', name: 'Temp. Ambiente', price: 0 },
        ];
      case 'Postres':
        return [];
      default:
        return [];
    }
  };

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

  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Todos'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MenuItem[];
        setProducts(productsList);
      } catch (error) {
        console.error("Error conectando con Firebase:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredItems = products.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity) + (item.extras ? item.extras.reduce((s, ex) => s + (ex.price || 0) * (item.quantity || 1), 0) : 0), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const currentOptions = selectedItem ? getCategoryOptions(selectedItem.category) : [];

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
      {/* Panel Izquierdo */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background-dark">
        <header className="flex items-center justify-between border-b border-white/5 p-6">
          <div className="flex flex-col">
            <h1 className="text-white text-3xl font-black tracking-[-0.033em]">Selección de Artículos</h1>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-primary" 
              style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Cajero&background=4169E1&color=fff")' }}
            ></div>
            <div className="hidden md:flex flex-col text-right">
              <h2 className="text-white text-base font-medium">Caja</h2>
              <p className="text-secondary text-sm">Activo</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
                        <span className="material-symbols-outlined">search</span>
                    </div>
                    <input 
                        type="text"
                        className="w-full bg-surface-dark border-none rounded-xl py-3 pl-12 pr-4 text-white placeholder-secondary focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="Buscar por nombre de artículo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-8 overflow-x-auto border-b border-white/10 no-scrollbar">
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

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-secondary opacity-70">
                    <p>No se encontraron productos.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map(item => {
                          const currentStock = item.stock ?? 0;
                          const isOutOfStock = currentStock <= 0;

                          return (
                            <div 
                              key={item.id}
                              onClick={() => {
                                if (isOutOfStock) return;
                                openCustomize(item);
                              }}
                              className={`relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 transition-transform ${
                                isOutOfStock 
                                  ? 'cursor-not-allowed opacity-50 grayscale-[0.5]' 
                                  : 'cursor-pointer hover:scale-[1.02] hover:bg-white/5 border border-transparent hover:border-primary/50'
                              }`}
                            >
                                <div 
                                    className="aspect-square w-full rounded-lg bg-cover bg-center bg-gray-700" 
                                    style={{ backgroundImage: `url('${item.image || 'https://placehold.co/200x200/36454F/FFF?text=IMG'}')` }}
                                ></div>
                                
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
                                      <p className="text-sm text-primary font-mono font-bold">${item.price.toFixed(2)}</p>
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

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-dark rounded-xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-1 text-white">Personalizar: {selectedItem.name}</h3>
            <p className="text-xs text-primary mb-4 font-bold uppercase tracking-wider">{selectedItem.category}</p>

            {currentOptions.length > 0 && (
                <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                  <label className="block text-sm text-secondary font-bold mb-3 uppercase text-xs">Opciones y Extras</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {currentOptions.map(ex => (
                      <label key={ex.id} className="flex items-center gap-3 text-white p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                        <div className={`size-5 rounded border flex items-center justify-center transition-colors ${
                            selectedExtras.some(e => e.id === ex.id) ? 'bg-primary border-primary' : 'border-gray-500'
                        }`}>
                            {selectedExtras.some(e => e.id === ex.id) && (
                                <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                            )}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden"
                            checked={selectedExtras.some(e => e.id === ex.id)} 
                            onChange={() => toggleExtra(ex)} 
                        />
                        <span className="text-sm select-none">{ex.name} {ex.price > 0 ? `(+$${ex.price.toFixed(2)})` : ''}</span>
                      </label>
                    ))}
                  </div>
                </div>
            )}

            <div className="mb-4">
              <label className="block text-xs text-secondary font-bold uppercase mb-2">Notas de Cocina</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full bg-black/20 rounded-lg p-3 text-white border border-white/10 focus:border-primary focus:outline-none text-sm resize-none" 
                placeholder="Ej: Sin cebolla, extra picante..." 
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
              <label className="text-sm text-white font-bold">Cantidad</label>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="size-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">remove</span>
                </button>
                <span className="w-8 text-center text-white font-bold">{quantity}</span>
                <button 
                    onClick={() => setQuantity(q => {
                        const max = selectedItem?.stock ?? 9999;
                        return Math.min(max, q + 1);
                    })} 
                    className="size-8 flex items-center justify-center text-white hover:bg-white/10 rounded transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button 
                onClick={() => { setSelectedItem(null); setSelectedExtras([]); setNotes(''); setQuantity(1); }} 
                className="px-4 py-3 bg-transparent text-gray-300 font-bold hover:text-white transition-colors"
              >
                Cancelar
              </button>
              
              <button 
                onClick={() => { handleConfirmAdd(); }} 
                disabled={!selectedItem || (selectedItem.stock ?? 0) <= 0} 
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold disabled:opacity-50 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <span>Agregar</span>
                <span className="bg-black/20 px-2 py-0.5 rounded text-xs">
                    ${((selectedItem.price * quantity) + (selectedExtras.reduce((acc, ex) => acc + ex.price, 0) * quantity)).toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Derecho */}
      <div className="hidden lg:flex w-[400px] flex-col border-l border-white/5 bg-surface-darker">
        <header className="flex items-center justify-between p-6 bg-surface-darker border-b border-white/5">
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
                    <div key={item.id} className="flex items-center gap-4 rounded-xl bg-surface-dark p-3 border border-white/5 shadow-sm">
                        <div 
                           className="size-16 rounded-lg bg-cover bg-center bg-gray-800 shrink-0"
                           style={{ backgroundImage: `url('${item.image || ''}')` }} 
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <div className="text-xs text-secondary space-y-0.5">
                                {item.extras && item.extras.length > 0 && (
                                    <p className="truncate">+ {item.extras.map(e => e.name).join(', ')}</p>
                                )}
                                {item.notes && <p className="italic text-gray-400 truncate">"{item.notes}"</p>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-2 bg-white/5 rounded-lg p-0.5">
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
                            <p className="font-bold text-white font-mono">
                                ${((item.price * item.quantity) + (item.extras ? item.extras.reduce((s, ex) => s + (ex.price || 0) * item.quantity, 0) : 0)).toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="border-t border-white/5 bg-surface-darker p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-base">
              <p className="text-secondary">Subtotal</p>
              <p className="font-medium text-white">${subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-base">
              <p className="text-secondary">IVA (16%)</p>
              <p className="font-medium text-white">${tax.toFixed(2)}</p>
            </div>
            <div className="my-2 border-t border-dashed border-white/10"></div>
            <div className="flex justify-between text-xl">
              <p className="font-bold text-white">Total</p>
              <p className="font-black text-primary text-2xl">${total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button 
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              Pagar e Imprimir
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};