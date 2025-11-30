import React from 'react';
import { CartItem } from '../types';

interface PaymentViewProps {
  cart: CartItem[];
  onBack: () => void;
  onComplete: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ cart, onBack, onComplete }) => {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16; // Using 16% from the screenshot example
  const total = subtotal + tax;

  return (
    <main className="flex-1 p-4 lg:p-8 overflow-y-auto bg-background-dark">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-4">
                     <button onClick={onBack} className="p-2 rounded-full hover:bg-white/10 text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-white text-4xl font-black tracking-[-0.033em]">Procesar Pago</h1>
                </div>
                <p className="text-secondary text-base font-normal ml-14">Orden #124 • Mesa 5</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2">
                <div className="bg-[#102316] rounded-xl border border-white/10 h-full flex flex-col">
                    <h3 className="text-white text-lg font-bold px-6 py-4 border-b border-white/10">Resumen del Pedido</h3>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px]">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14" 
                                        style={{ backgroundImage: `url('${item.image}')` }}
                                    ></div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-white text-base font-medium line-clamp-1">{item.name}</p>
                                        <p className="text-secondary text-sm line-clamp-2">Cantidad: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <p className="text-white text-base font-normal">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 mt-auto border-t border-white/10 space-y-3 bg-[#142d1c] rounded-b-xl">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-300">Subtotal</p>
                            <p className="text-white font-medium">${subtotal.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-gray-300">Impuestos (16%)</p>
                            <p className="text-white font-medium">${tax.toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-bold mt-2 pt-4 border-t border-dashed border-white/10">
                            <p className="text-white">Total a Pagar</p>
                            <p className="text-primary">${total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Methods & Actions */}
            <div className="lg:col-span-3">
                <div className="bg-[#102316] rounded-xl border border-white/10 p-6 space-y-6">
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Seleccione un Método de Pago</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-primary bg-primary/10 transition-all">
                                <span className="material-symbols-outlined text-primary text-4xl">payments</span>
                                <span className="text-primary font-bold text-sm">Efectivo</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-white text-4xl">credit_card</span>
                                <span className="text-white font-semibold text-sm">Tarjeta</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-white text-4xl">sync_alt</span>
                                <span className="text-white font-semibold text-sm">Transferencia</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-white/10 hover:border-primary/50 hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-white text-4xl">confirmation_number</span>
                                <span className="text-white font-semibold text-sm">Vales</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Monto Recibido</label>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-lg">$</span>
                                <input 
                                    className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-primary focus:border-primary text-white text-lg font-mono"
                                    type="text" 
                                    defaultValue="500.00" 
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Aplicar Descuento</label>
                                <input 
                                    className="w-full px-4 py-3 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-primary focus:border-primary text-white" 
                                    placeholder="Ej: BIENVENIDO10" 
                                    type="text"
                                />
                            </div>
                            <button className="px-6 py-3 rounded-lg bg-[#22492f] text-primary font-bold text-sm hover:bg-[#2b593a] transition-colors border border-primary/20">
                                Aplicar
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#22492f] p-4 rounded-xl flex justify-between items-center border border-primary/20">
                        <span className="text-lg font-bold text-white">Cambio a devolver</span>
                        <span className="text-3xl font-black text-primary">$76.60</span>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                        <button 
                            onClick={onComplete}
                            className="w-full bg-primary text-surface-darker font-bold py-4 rounded-xl text-lg hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                        >
                            Cobrar ${total.toFixed(2)}
                        </button>
                        <div className="flex gap-3">
                            <button className="w-full bg-white/10 text-white font-bold py-3 rounded-xl text-base hover:bg-white/20 transition-colors">
                                Dividir Cuenta
                            </button>
                            <button onClick={onBack} className="w-full bg-transparent text-gray-400 font-bold py-3 rounded-xl text-base hover:text-white hover:bg-white/5 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};