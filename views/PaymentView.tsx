import React, { useState } from 'react';
import { CartItem, OrderStatus } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface PaymentViewProps {
  cart: CartItem[];
  onBack: () => void;
  onComplete: () => void;
}

export const PaymentView: React.FC<PaymentViewProps> = ({ cart, onBack, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false); // Estado para mostrar el ticket
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null); // Guardar datos para el ticket
  
  // Estado para controlar el método de pago ('cash' o 'card')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  
  // Estados para Efectivo
  const [receivedAmount, setReceivedAmount] = useState('');

  // Estados para Tarjeta (Simulación)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Cálculos financieros
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  
  // Validación de Efectivo: El monto recibido debe cubrir el total
  const change = parseFloat(receivedAmount || '0') - total;
  const isCashValid = parseFloat(receivedAmount || '0') >= total;

  // Validación de Tarjeta: Campos básicos llenos (Simulación)
  const isCardValid = cardNumber.length >= 16 && cardExpiry.length >= 4 && cardCvv.length >= 3;

  const handlePayment = async () => {
    if (cart.length === 0) return;

    try {
      setIsProcessing(true);
      
      // Simulamos un pequeño delay de procesamiento bancario si es tarjeta
      if (paymentMethod === 'card') {
          await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const orderData = {
        customerName: "Cliente Mostrador",
        items: cart,
        total: total,
        subtotal: subtotal,
        tax: tax,
        status: OrderStatus.PREPARING,
        createdAt: serverTimestamp(),
        tableNumber: 5,
        type: 'Dine-in',
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'card' ? { last4: cardNumber.slice(-4) } : null,
        change: paymentMethod === 'cash' ? change : 0,
        receivedAmount: paymentMethod === 'cash' ? parseFloat(receivedAmount) : total
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      
      // En lugar de llamar a onComplete directo, mostramos el ticket primero
      setLastOrderDetails({ ...orderData, id: docRef.id, date: new Date() });
      setShowTicket(true);

    } catch (error) {
      console.error("Error al procesar el pedido:", error);
      alert("Hubo un error al guardar el pedido. Intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintAndClose = () => {
      window.print(); // Abre el diálogo de impresión del navegador
      setShowTicket(false);
      onComplete(); // Limpia el carrito y vuelve al inicio
  };

  // --- COMPONENTE DEL TICKET (MODAL) ---
  if (showTicket && lastOrderDetails) {
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-white text-black w-full max-w-sm rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Cabecera del Ticket */}
                  <div className="p-6 text-center border-b-2 border-dashed border-gray-300">
                      <h2 className="text-2xl font-black uppercase tracking-widest mb-1">Restaurante</h2>
                      <p className="text-xs font-mono text-gray-500">Av. Reforma 222, CDMX</p>
                      <p className="text-xs font-mono text-gray-500">RFC: XAXX010101000</p>
                      <div className="mt-4 text-left font-mono text-sm">
                          <p>Orden: #{lastOrderDetails.id.slice(-6).toUpperCase()}</p>
                          <p>Fecha: {lastOrderDetails.date.toLocaleString()}</p>
                          <p>Cajero: Turno 1</p>
                      </div>
                  </div>

                  {/* Lista de Items */}
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

                  {/* Totales */}
                  <div className="p-6 bg-gray-50 border-t-2 border-dashed border-gray-300 font-mono text-sm">
                      <div className="flex justify-between mb-1">
                          <span>Subtotal:</span>
                          <span>${lastOrderDetails.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2 pb-2 border-b border-gray-300">
                          <span>IVA (16%):</span>
                          <span>${lastOrderDetails.tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold mb-4">
                          <span>TOTAL:</span>
                          <span>${lastOrderDetails.total.toFixed(2)}</span>
                      </div>
                      
                      <div className="text-xs space-y-1 text-gray-600">
                          <p>Pago: {lastOrderDetails.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}</p>
                          {lastOrderDetails.paymentMethod === 'cash' && (
                              <>
                                <p>Recibido: ${lastOrderDetails.receivedAmount.toFixed(2)}</p>
                                <p>Cambio: ${lastOrderDetails.change.toFixed(2)}</p>
                              </>
                          )}
                          {lastOrderDetails.paymentMethod === 'card' && (
                              <p>Tarjeta: **** {lastOrderDetails.paymentDetails.last4}</p>
                          )}
                      </div>
                  </div>

                  {/* Footer del Ticket */}
                  <div className="p-4 bg-gray-100 border-t border-gray-200 text-center space-y-2 print:hidden">
                      <button 
                          onClick={handlePrintAndClose}
                          className="w-full bg-black text-white font-bold py-3 rounded hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                      >
                          <span className="material-symbols-outlined">print</span>
                          Imprimir y Finalizar
                      </button>
                      <button 
                          onClick={() => { setShowTicket(false); onComplete(); }}
                          className="w-full bg-white text-gray-600 font-bold py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                          Cerrar sin Imprimir
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
                <p className="text-secondary text-base font-normal ml-14">Nueva Orden • Mesa 5</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Resumen del Pedido (Izquierda) */}
            <div className="lg:col-span-2">
                <div className="bg-[#102316] rounded-xl border border-white/10 h-full flex flex-col">
                    <h3 className="text-white text-lg font-bold px-6 py-4 border-b border-white/10">Resumen del Pedido</h3>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px]">
                        {cart.map(item => (
                            <div key={item.id} className="flex items-center gap-4 px-4 py-3 justify-between hover:bg-white/5 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 bg-gray-800" 
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

            {/* Métodos de Pago y Acciones (Derecha) */}
            <div className="lg:col-span-3">
                <div className="bg-[#102316] rounded-xl border border-white/10 p-6 space-y-6">
                    
                    {/* Selector de Método */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4">Seleccione un Método de Pago</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all ${
                                    paymentMethod === 'cash' 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-white/10 hover:border-white/30 text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-4xl">payments</span>
                                <span className="font-bold text-sm">Efectivo</span>
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('card')}
                                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 transition-all ${
                                    paymentMethod === 'card' 
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                                    : 'border-white/10 hover:border-white/30 text-gray-400'
                                }`}
                            >
                                <span className="material-symbols-outlined text-4xl">credit_card</span>
                                <span className="font-bold text-sm">Tarjeta</span>
                            </button>
                        </div>
                    </div>

                    {/* Contenido Dinámico según el Método */}
                    <div className="min-h-[220px]">
                        {paymentMethod === 'cash' ? (
                            <div className="space-y-6 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Monto Recibido</label>
                                    <div className="relative">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 text-lg">$</span>
                                        <input 
                                            className="w-full pl-8 pr-4 py-4 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-primary focus:border-primary text-white text-2xl font-mono font-bold"
                                            type="number" 
                                            placeholder="0.00"
                                            value={receivedAmount}
                                            onChange={(e) => setReceivedAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#22492f] p-4 rounded-xl flex justify-between items-center border border-primary/20">
                                    <span className="text-lg font-bold text-white">Cambio a devolver</span>
                                    <span className={`text-3xl font-black ${change < 0 ? 'text-red-400' : 'text-primary'}`}>
                                        ${change >= 0 ? change.toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3 text-blue-200 mb-4">
                                    <span className="material-symbols-outlined">point_of_sale</span>
                                    <p className="text-sm">Ingrese los datos de la tarjeta o deslice en la terminal.</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Número de Tarjeta</label>
                                    <input 
                                        className="w-full px-4 py-3 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-blue-500 text-white font-mono text-lg"
                                        type="text"
                                        maxLength={19}
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Expiración (MM/AA)</label>
                                        <input 
                                            className="w-full px-4 py-3 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-blue-500 text-white font-mono text-lg"
                                            type="text"
                                            placeholder="MM/YY"
                                            maxLength={5}
                                            value={cardExpiry}
                                            onChange={(e) => setCardExpiry(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">CVC / CVV</label>
                                        <input 
                                            className="w-full px-4 py-3 rounded-lg bg-[#22492f]/40 border border-white/10 focus:ring-blue-500 text-white font-mono text-lg"
                                            type="password"
                                            maxLength={4}
                                            placeholder="123"
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 pt-6 border-t border-white/10 mt-2">
                        <button 
                            onClick={handlePayment}
                            disabled={isProcessing || (paymentMethod === 'cash' ? !isCashValid : !isCardValid)}
                            className={`w-full font-bold py-4 rounded-xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                paymentMethod === 'card' 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20' 
                                : 'bg-primary text-surface-darker hover:bg-primary-hover shadow-primary/20'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                    Procesando...
                                </>
                            ) : (
                                `Cobrar $${total.toFixed(2)}`
                            )}
                        </button>
                        <button onClick={onBack} className="w-full bg-transparent text-gray-400 font-bold py-3 rounded-xl text-base hover:text-white hover:bg-white/5 transition-colors">
                            Cancelar Operación
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};