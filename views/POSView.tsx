import React, { useState, useEffect } from 'react';
import { MenuItem, CartItem } from '../types';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

interface POSViewProps {
  cart: CartItem[];
  addToCart: (item: MenuItem, options?: { extras?: Array<{ id?: string; name: string; price?: number }>; notes?: string; quantity?: number }) => void;
  updateQuantity: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  editCartItem: (id: string, updates: any) => void; // Nueva prop
  clearCart: () => void;
  onCheckout: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ 
  cart, 
  addToCart, 
  updateQuantity, 
  removeFromCart,
  editCartItem,
  clearCart,
  onCheckout
}) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del Modal
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingCartId, setEditingCartId] = useState<string | null>(null); // Para saber si estamos editando
  const [selectedExtras, setSelectedExtras] = useState<Array<{ id?: string; name: string; price?: number }>>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // --- LÓGICA DE OPCIONES ---
  const getCategoryOptions = (category: string) => {
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
      default: return [];
    }
  };

  // --- ABRIR MODAL (NUEVO ITEM) ---
  const openCustomizeNew = (item: MenuItem) => {
    setSelectedItem(item);
    setEditingCartId(null); // Modo nuevo
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
  };

  // --- ABRIR MODAL (EDITAR ITEM EXISTENTE) ---
  const openCustomizeEdit = (cartItem: CartItem) => {
    setSelectedItem(cartItem); // CartItem extiende MenuItem, así que sirve
    setEditingCartId(cartItem.internalId); // Guardamos ID para saber cuál actualizar
    setSelectedExtras(cartItem.extras || []);
    setNotes(cartItem.notes || '');
    setQuantity(cartItem.quantity);
  };

  const toggleExtra = (ex: any) => {
    setSelectedExtras(prev => prev.some(p => p.id === ex.id) ? prev.filter(p => p.id !== ex.id) : [...prev, ex]);
  };

  const handleConfirm = () => {
    if (!selectedItem) return;

    if (editingCartId) {
        // Estamos editando uno existente
        editCartItem(editingCartId, { extras: selectedExtras, notes, quantity });
    } else {
        // Estamos agregando uno nuevo
        addToCart(selectedItem, { extras: selectedExtras, notes, quantity });
    }
    
    // Resetear y cerrar
    setSelectedItem(null);
    setEditingCartId(null);
    setSelectedExtras([]);
    setNotes('');
    setQuantity(1);
  };

  // Fetch inicial
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const q = await getDocs(collection(db, "products"));
        setProducts(q.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
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

  return (
    <main className="flex h-full flex-1 overflow-hidden">
      {/* Panel Izquierdo: Selección */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background-dark">
        {/* Header y Filtros (Sin cambios mayores, solo referencias de color actualizadas) */}
        <header className="flex items-center justify-between border-b border-white/5 p-6">
          <h1 className="text-white text-3xl font-black">Selección de Artículos</h1>
          <div className="hidden md:flex flex-col text-right">
              <h2 className="text-white text-base font-medium">Caja</h2>
              <p className="text-secondary text-sm">Activo</p>
          </div>
        </header>

        <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4">
                <input type="text" className="w-full bg-surface-dark border-none rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary outline-none" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <div className="flex gap-8 overflow-x-auto border-b border-white/10 no-scrollbar">
                    {['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Todos'].map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`pb-3 pt-2 text-sm font-bold border-b-[3px] transition-colors ${activeCategory === cat ? 'border-primary text-white' : 'border-transparent text-secondary hover:text-white'}`}>{cat}</button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {isLoading ? <p className="text-center text-white mt-10">Cargando...</p> : 
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const noStock = (item.stock ?? 0) <= 0;
                        return (
                            <div key={item.id} onClick={() => !noStock && openCustomizeNew(item)} className={`relative flex flex-col gap-3 rounded-xl bg-surface-dark p-3 transition-transform ${noStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] hover:bg-white/5'}`}>
                                <div className="aspect-square w-full rounded-lg bg-cover bg-center bg-gray-700" style={{ backgroundImage: `url('${item.image}')` }}></div>
                                {noStock && <div className="absolute inset-0 flex items-center justify-center"><span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">AGOTADO</span></div>}
                                <div>
                                    <p className="text-base font-bold text-white line-clamp-1">{item.name}</p>
                                    <p className="text-sm text-primary font-bold">${item.price.toFixed(2)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>}
            </div>
        </div>
      </div>

      {/* Modal Personalización */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-surface-dark rounded-xl p-6 shadow-2xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-1">{editingCartId ? 'Editar:' : 'Agregar:'} {selectedItem.name}</h3>
            
            {currentOptions.length > 0 && (
                <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5 mt-4">
                  <label className="block text-secondary text-xs font-bold uppercase mb-2">Extras</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {currentOptions.map(ex => (
                      <label key={ex.id} className="flex items-center gap-2 text-white p-2 hover:bg-white/5 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedExtras.some(e => e.id === ex.id)} onChange={() => toggleExtra(ex)} className="accent-primary" />
                        <span className="text-sm">{ex.name} {ex.price > 0 && `(+$${ex.price})`}</span>
                      </label>
                    ))}
                  </div>
                </div>
            )}

            <div className="mb-4">
              <label className="block text-secondary text-xs font-bold uppercase mb-2">Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-black/20 rounded-lg p-3 text-white border border-white/10 focus:border-primary outline-none text-sm" placeholder="Ej: Sin cebolla..." rows={2} />
            </div>

            <div className="flex items-center justify-between gap-4 mb-6 bg-black/20 p-3 rounded-lg border border-white/5">
              <label className="text-sm text-white font-bold">Cantidad</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="size-8 bg-white/10 rounded hover:bg-white/20 text-white">-</button>
                <span className="font-bold text-white w-6 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min((selectedItem.stock ?? 999), q + 1))} className="size-8 bg-white/10 rounded hover:bg-white/20 text-white">+</button>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 text-gray-300 font-bold hover:text-white">Cancelar</button>
              <button onClick={handleConfirm} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover shadow-lg">
                  {editingCartId ? 'Guardar Cambios' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel Derecho: Carrito */}
      <div className="hidden lg:flex w-[400px] flex-col border-l border-white/5 bg-surface-darker">
        <header className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-2xl font-bold text-white">Pedido Actual</h3>
          <button onClick={clearCart} className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-1"><span className="material-symbols-outlined">delete</span> Vaciar</button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
            {cart.map(item => (
                <div key={item.internalId} className="flex flex-col gap-2 bg-surface-dark p-3 rounded-xl border border-white/5 relative group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-white">{item.name}</p>
                            <div className="text-xs text-secondary mt-1">
                                {item.extras?.map(e => <span key={e.id} className="block">+ {e.name}</span>)}
                                {item.notes && <span className="block italic text-gray-400">"{item.notes}"</span>}
                            </div>
                        </div>
                        <p className="font-mono text-white font-bold">${((item.price * item.quantity) + (item.extras?.reduce((a,b)=>a+(b.price||0),0)||0)*item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.internalId, -1)} className="size-6 flex items-center justify-center text-white hover:bg-white/10 rounded">-</button>
                            <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.internalId, 1)} className="size-6 flex items-center justify-center text-white hover:bg-white/10 rounded">+</button>
                        </div>
                        
                        {/* BOTONES DE ACCIÓN: EDITAR Y ELIMINAR */}
                        <div className="flex gap-1">
                            <button onClick={() => openCustomizeEdit(item)} className="p-1.5 text-secondary hover:text-white hover:bg-white/10 rounded" title="Editar">
                                <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => removeFromCart(item.internalId)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded" title="Eliminar">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-surface-darker p-6 border-t border-white/5 shadow-2xl">
            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-secondary"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-secondary"><span>IVA (16%)</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/10"><span>Total</span><span className="text-primary">${total.toFixed(2)}</span></div>
            </div>
            <button onClick={onCheckout} disabled={cart.length===0} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-lg shadow-primary/20">
                Pagar e Imprimir
            </button>
        </div>
      </div>
    </main>
  );
};