import React, { useState } from 'react';
import { CartItem, OrderStatus } from '../types';
import { db } from '../firebase';
import { collection, serverTimestamp, writeBatch, doc, increment } from 'firebase/firestore';

interface PaymentViewProps {
  cart: CartItem[];
  onBack: () => void;
  onComplete: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ cart, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  
  // ESTADO NUEVO: Nombre del cliente
  const [customerName, setCustomerName] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [receivedAmount, setReceivedAmount] = useState('');

  // Cálculos
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  
  const change = parseFloat(receivedAmount || '0') - total;
  const isCashValid = parseFloat(receivedAmount || '0') >= total;
  
  // Denominaciones comunes
  const DENOMINATIONS = [20, 50, 100, 200, 500, 1000];

  const handlePayment = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessing(true);
      
      // Simulación de espera de la terminal bancaria
      if (paymentMethod === 'card') {
          await new Promise(resolve => setTimeout(resolve, 3000)); // 3 segundos de "procesando"
      }

      // --- INICIO DE TRANSACCIÓN ATÓMICA (BATCH) ---
      const batch = writeBatch(db);

      // 1. Preparar datos del pedido
      const newOrderRef = doc(collection(db, "orders"));
      
      // CAMBIO: Usamos el nombre ingresado o un default
      const finalCustomerName = customerName.trim() || "Cliente Mostrador";

      const orderData = {
        customerName: finalCustomerName, // <--- Aquí guardamos el nombre real
        items: cart,
        total: total,
        subtotal: subtotal,
        tax: tax,
        status: OrderStatus.PREPARING,
        createdAt: serverTimestamp(),
        tableNumber: 5, // Podrías hacer esto dinámico también si quisieras
        type: 'Dine-in',
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'card' ? { last4: 'TERM' } : null,
        change: paymentMethod === 'cash' ? change : 0,
        receivedAmount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total
      };

      batch.set(newOrderRef, orderData);

      // 2. Restar stock del inventario
      cart.forEach((item) => {
          const productRef = doc(db, "products", item.id);
          batch.update(productRef, {
              stock: increment(-item.quantity)
          });
      });

      await batch.commit();
      
      setLastOrderDetails({ ...orderData, id: newOrderRef.id, date: new Date() });
      setShowTicket(true);

    } catch (error) {
      console.error("Error al procesar venta e inventario:", error);
      alert("Error crítico: No se pudo procesar la venta ni actualizar el inventario.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintAndClose = () => {
      window.print();
      setShowTicket(false);
      onComplete();
  };

  // --- MODAL DE TICKET ---
  if (showTicket && lastOrderDetails) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-white text-black w-full max-w-sm rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 text-center border-b-2 border-dashed border-gray-300">
                      <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Restaurante</h2>
                      <p className="text-xs font-mono text-gray-500">Av. Reforma 222, CDMX</p>
                      <div className="mt-4 text-left font-mono text-sm">
                          <p>Orden: #{lastOrderDetails.id.slice(-6).toUpperCase()}</p>
                          <p>Fecha: {lastOrderDetails.date.toLocaleString()}</p>
                          {/* CAMBIO: Mostrar nombre del cliente en el ticket */}
                          <p className="font-bold">Cliente: {lastOrderDetails.customerName}</p>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 font-mono text-sm">
                      <table className="w-full">
                          <thead>
                              <tr className="border-b border-black">
                                  <th className="text-left pb-2">Cant</th>
                                  <th className="text-left pb-2">Desc</th>
                                  <th className="text-right pb-2">Importe</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-dashed divide-gray-300">
                              {lastOrderDetails.items.map((item: any, idx: number) => (
                                  <tr key={idx}>
                                      <td className="py-2 align-top">{item.quantity}</td>
                                      <td className="py-2 align-top">{item.name}</td>
                                      <td className="py-2 align-top text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>

                  <div className="p-6 bg-gray-50 border-t-2 border-dashed border-gray-300 font-mono text-sm">
                      <div className="flex justify-between text-xl font-bold mb-4">
                          <span>TOTAL:</span>
                          <span>${lastOrderDetails.total.toFixed(2)}</span>
                      </div>
                      <div className="text-xs space-y-1 text-gray-600">
                          <p>Pago: {lastOrderDetails.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA (TERMINAL)'}</p>
                          {lastOrderDetails.paymentMethod === 'cash' && (
                              <p>Cambio: ${lastOrderDetails.change.toFixed(2)}</p>
                          )}
                      </div>
                  </div>

                  <div className="p-4 bg-gray-100 border-t border-gray-200 text-center space-y-2 print:hidden">
                      <button onClick={handlePrintAndClose} className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined">print</span> Imprimir
                      </button>
                      <button onClick={() => { setShowTicket(false); onComplete(); }} className="w-full bg-white text-gray-600 font-bold py-2 rounded border border-gray-300">
                          Cerrar
                      </button>
                  </div>
              </div>
          </div>
      );
  }

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
                <p className="text-secondary text-base font-normal ml-14">Nueva Orden</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Panel Izquierdo: Resumen */}
            <div className="lg:col-span-2">
                <div className="bg-[#102316] rounded-xl border border-white/10 h-full flex flex-col">
                    <h3 className="text-white text-lg font-bold px-6 py-4 border-b border-white/10">Resumen del Pedido</h3>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px]">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 bg-gray-800" style={{ backgroundImage: `url('${item.image}')` }}></div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-white text-base font-medium line-clamp-1">{item.name}</p>
                                        <p className="text-secondary text-sm line-clamp-2">x{item.quantity}</p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <p className="text-white text-base font-normal">${(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 mt-auto border-t border-white/10 space-y-3 bg-[#142d1c] rounded-b-xl">
                        <div className="flex justify-between items-center text-2xl font-bold mt-2 pt-4 border-t border-dashed border-white/10">
                            <p className="text-white">Total a Pagar</p>
                            <p className="text-primary">${total.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel Derecho: Pago */}
            <div className="lg:col-span-3">
                <div className="bg-[#102316] rounded-xl border border-white/10 p-6 space-y-6">
                    
                    {/* CAMBIO: Campo para ingresar nombre del cliente */}
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Cliente (Opcional)</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                                <span className="material-symbols-outlined">person</span>
                            </span>
                            <input 
                                type="text" 
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#22492f]/40 border border-white/10 focus:ring-primary focus:border-primary text-white placeholder-gray-500 outline-none transition-all"
                                placeholder="Nombre del cliente..."
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/5 my-2"></div>

                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Seleccione Método</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 text-gray-400'}`}>
                                <span className="material-symbols-outlined text-4xl">payments</span>
                                <span className="font-bold text-sm">Efectivo</span>
                            </button>
                            <button onClick={() => setPaymentMethod('card')} className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/10 text-gray-400'}`}>
                                <span className="material-symbols-outlined text-4xl">credit_card</span>
                                <span className="font-bold text-sm">Tarjeta</span>
                            </button>
                        </div>
                    </div>

                    <div className="min-h-[220px] flex flex-col justify-center">
                        {paymentMethod === 'cash' ? (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Monto Recibido</label>
                                    
                                    {/* Botones de Denominación Rápida */}
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        {DENOMINATIONS.map(amount => (
                                            <button 
                                                key={amount}
                                                onClick={() => setReceivedAmount(amount.toString())}
                                                className="bg-[#22492f] text-white hover:bg-white/10 border border-white/10 font-bold py-3 rounded-lg transition-colors"
                                            >
                                                ${amount}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-lg">$</span>
                                        <input 
                                            className="w-full pl-8 pr-4 py-4 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-primary focus:border-primary text-white text-2xl font-mono font-bold placeholder-gray-600" 
                                            type="number" 
                                            placeholder="Ingresar cantidad manual..." 
                                            value={receivedAmount} 
                                            onChange={(e) => setReceivedAmount(e.target.value)} 
                                            autoFocus 
                                        />
                                    </div>
                                </div>
                                <div className="bg-[#22492f] p-4 rounded-xl flex justify-between items-center border border-primary/20">
                                    <span className="text-lg font-bold text-white">Cambio</span>
                                    <span className={`text-3xl font-black ${change < 0 ? 'text-red-400' : 'text-primary'}`}>${change >= 0 ? change.toFixed(2) : '0.00'}</span>
                                </div>
                            </div>
                        ) : (
                            /* --- UI DE TERMINAL BANCARIA --- */
                            <div className="space-y-6 animate-fade-in text-center p-6 bg-blue-500/5 rounded-xl border border-blue-500/20">
                                <div className="mx-auto size-24 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-2">
                                    {isProcessing ? (
                                        <span className="material-symbols-outlined text-5xl animate-pulse">wifi</span>
                                    ) : (
                                        <span className="material-symbols-outlined text-5xl">point_of_sale</span>
                                    )}
                                </div>
                                
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">
                                        {isProcessing ? 'Procesando en Terminal...' : 'Listo para Cobrar'}
                                    </h4>
                                    <p className="text-gray-400 text-sm">
                                        {isProcessing 
                                            ? 'Por favor espere la confirmación del banco.' 
                                            : 'Inserte o deslice la tarjeta en la terminal física.'}
                                    </p>
                                </div>

                                {!isProcessing && (
                                    <div className="bg-black/20 p-4 rounded-lg inline-block">
                                        <p className="text-blue-300 font-mono text-2xl font-bold tracking-widest">
                                            Total: ${total.toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-2">
                        <button 
                            onClick={handlePayment} 
                            disabled={isProcessing || (paymentMethod === 'cash' ? !isCashValid : false)} 
                            className={`w-full font-bold py-4 rounded-xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'card' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20' : 'bg-primary text-surface-darker hover:bg-primary-hover shadow-primary/20'}`}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    <span>Conectando...</span>
                                </>
                            ) : (
                                `Cobrar $${total.toFixed(2)}`
                            )}
                        </button>
                        <button onClick={onBack} disabled={isProcessing} className="w-full bg-transparent text-gray-400 font-bold py-3 rounded-xl text-base hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};