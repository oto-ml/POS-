import React, { useState } from 'react';
import { MenuItem, CartItem, ViewState } from '../types';
import { MENU_ITEMS } from '../constants';

interface POSViewProps {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  onCheckout: () => void;
}

export const POSView: React.FC<POSViewProps> = ({ 
  cart, 
  addToCart, 
  updateQuantity, 
  removeFromCart,
  clearCart,
  onCheckout
}) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Todos'];

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = activeCategory === 'Todos' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  return (
    <main className="flex h-full flex-1 overflow-hidden">
      {/* Left Panel: Menu Selection */}
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background-dark">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#22492f]/50 p-6">
          <div className="flex flex-col">
            <h1 className="text-white text-3xl font-black tracking-[-0.033em]">Selección de Artículos</h1>
            <p className="text-secondary text-base font-normal">Mesa #5</p>
          </div>
          <div className="flex items-center gap-4">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 border-2 border-[#22492f]" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCMEndqZwd7Id68L1ldbt7f50CcBadiTKA7-4yzHkWxaEnKng9VGSG5kDbpLm-nHgBVyeko4ZOwDO2oZuWhYWaBNmfXNpIH-fCcMNuAxCraUCV-F67g1xTK1BYgeILN2-9UAdirVdvBBATj_v4wRMjpAHkEM5DyaVEnp2Lvscoo69OhMGgUeRsNrWMVNCxm9wpl91uqwYLE_1Qufzy39d4ZKp_kncTi67mvtI9eXne5PPlVDB1-5LWGywG5PPk30_xU6Fici6i4kQxK")' }}
            ></div>
            <div className="hidden md:flex flex-col text-right">
              <h2 className="text-white text-base font-medium">Ana García</h2>
              <p className="text-secondary text-sm">Cajero</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search and Tabs */}
            <div className="px-6 py-4 space-y-4">
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

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="flex flex-col gap-3 rounded-xl bg-surface-dark p-3 transition-transform hover:scale-[1.02] cursor-pointer hover:bg-[#22492f]"
                        >
                            <div 
                                className="aspect-square w-full rounded-lg bg-cover bg-center" 
                                style={{ backgroundImage: `url('${item.image}')` }}
                            ></div>
                            <div className="flex flex-col">
                                <p className="text-base font-bold text-white leading-tight">{item.name}</p>
                                <p className="text-sm text-secondary mt-1">${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel: Current Order */}
      <div className="hidden lg:flex w-[400px] flex-col border-l border-[#22492f]/50 bg-[#142d1c]">
        <header className="flex items-center justify-between p-6">
          <h3 className="text-2xl font-bold text-white">Pedido Actual</h3>
          <button 
            onClick={clearCart}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary hover:bg-[#22492f]/50 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">delete</span>
            Vaciar
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6">
            {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50">
                    <span className="material-symbols-outlined text-6xl mb-4">shopping_cart_off</span>
                    <p>El carrito está vacío</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4 rounded-xl bg-background-dark p-3 border border-white/5">
                        <img src={item.image} alt={item.name} className="size-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white truncate">{item.name}</p>
                            <p className="text-xs text-secondary">{item.notes || 'Sin notas'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-2 bg-[#22492f] rounded-lg p-0.5">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                                    className="size-6 flex items-center justify-center text-white hover:bg-white/10 rounded"
                                >-</button>
                                <span className="w-4 text-center text-sm font-bold text-white">{item.quantity}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                                    className="size-6 flex items-center justify-center text-white hover:bg-white/10 rounded"
                                >+</button>
                            </div>
                            <p className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="border-t border-[#22492f]/50 bg-[#142d1c] p-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between text-base">
              <p className="text-secondary">Subtotal</p>
              <p className="font-medium text-white">${subtotal.toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-base">
              <p className="text-secondary">Impuestos (10%)</p>
              <p className="font-medium text-white">${tax.toFixed(2)}</p>
            </div>
            <div className="my-2 border-t border-dashed border-[#22492f]"></div>
            <div className="flex justify-between text-xl">
              <p className="font-bold text-white">Total</p>
              <p className="font-black text-white text-2xl">${total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="flex h-12 w-full items-center justify-center rounded-xl bg-[#22492f] text-sm font-bold text-white hover:bg-[#2b593a] transition-colors">
              Enviar a Cocina
            </button>
            <button 
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-background-dark hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pagar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};