import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Order } from '../types';

export const HistoryView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  useEffect(() => {
    const fetchOrdersByDate = async () => {
      setLoading(true);
      try {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
            collection(db, "orders"),
            where("createdAt", ">=", startOfDay),
            where("createdAt", "<=", endOfDay),
            orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const fetchedOrders = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setOrders(fetchedOrders);
        if (fetchedOrders.length > 0) {
            setSelectedOrder(fetchedOrders[0]);
        } else {
            setSelectedOrder(null);
        }
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrdersByDate();
  }, [selectedDate]);

  const dailySummary = {
      totalSales: orders.reduce((sum, order) => sum + (order.total || 0), 0),
      totalOrders: orders.length,
      cashTotal: orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.total || 0), 0),
      cardTotal: orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + (o.total || 0), 0),
  };

  const changeDate = (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      setSelectedDate(newDate);
  };

  const formatDate = (timestamp: any) => {
      if (!timestamp) return '-';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
  };

  const TicketModal = ({ order, onClose, title }: { order: any, onClose: () => void, title: string }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white text-black w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 text-center border-b-2 border-dashed border-gray-300">
                {/* NOMBRE ACTUALIZADO AQUÍ */}
                <h2 className="text-xl font-black uppercase mb-1">Restaurante Upiicsa</h2>
                <p className="text-xs font-mono text-gray-500">{title}</p>
                <div className="mt-4 text-left font-mono text-xs">
                    <p>Fecha: {order.createdAt ? formatDate(order.createdAt) : new Date().toLocaleString()}</p>
                    {order.id && <p>Folio: #{order.id.slice(-6).toUpperCase()}</p>}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
                {title === 'CORTE DE CAJA' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between font-bold border-b border-black pb-1">
                            <span>CONCEPTO</span>
                            <span>MONTO</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ventas Efectivo ({orders.filter(o => o.paymentMethod === 'cash').length})</span>
                            <span>${dailySummary.cashTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ventas Tarjeta ({orders.filter(o => o.paymentMethod === 'card').length})</span>
                            <span>${dailySummary.cardTotal.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-400 my-2"></div>
                        <div className="flex justify-between text-lg font-black">
                            <span>TOTAL NETO</span>
                            <span>${dailySummary.totalSales.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 text-center text-gray-500">
                            Total de Transacciones: {dailySummary.totalOrders}
                        </div>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-black">
                                <th className="text-left pb-2">Cant</th>
                                <th className="text-left pb-2">Desc</th>
                                <th className="text-right pb-2">Importe</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dashed divide-gray-300">
                            {order.items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-2 align-top">{item.quantity}</td>
                                    <td className="py-2 align-top">{item.name}</td>
                                    <td className="py-2 align-top text-right">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {title !== 'CORTE DE CAJA' && (
                <div className="p-6 bg-gray-50 border-t-2 border-dashed border-gray-300 font-mono text-xs">
                    <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL</span>
                        <span>${order.total?.toFixed(2)}</span>
                    </div>
                    <p className="mt-2">Pago: {order.paymentMethod === 'card' ? `Tarjeta (TERMINAL)` : 'Efectivo'}</p>
                </div>
            )}

            <div className="p-4 bg-gray-100 border-t border-gray-200 print:hidden text-center flex flex-col gap-2">
                <button onClick={() => window.print()} className="bg-black text-white py-3 rounded font-bold hover:bg-gray-800">
                    <span className="material-symbols-outlined align-middle mr-2">print</span>
                    Imprimir
                </button>
                <button onClick={onClose} className="text-gray-600 font-bold py-2 hover:bg-gray-200 rounded">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-white text-4xl font-black">Historial de Ventas</h1>
            
            <div className="flex items-center gap-4 bg-[#102316] p-2 rounded-xl border border-white/10">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="text-center px-4">
                    <p className="text-secondary text-xs font-bold uppercase">Viendo fecha</p>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_today</span>
                        <span className="text-white font-bold text-lg">
                            {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            <button 
                onClick={() => setShowSummaryModal(true)}
                className="bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:bg-primary-hover flex items-center gap-2 shadow-lg shadow-primary/20"
            >
                <span className="material-symbols-outlined">receipt_long</span>
                Corte del Día
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
            <div className="lg:col-span-2 bg-[#102316] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10 bg-[#183422] flex justify-between items-center">
                    <h3 className="font-bold text-white">Transacciones ({orders.length})</h3>
                    <span className="text-primary font-mono font-bold">Total: ${dailySummary.totalSales.toFixed(2)}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-white">
                            <span className="material-symbols-outlined animate-spin mr-2">refresh</span> Cargando...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50 p-10">
                            <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                            <p>No hay ventas registradas en esta fecha.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="text-secondary text-xs uppercase font-bold sticky top-0 bg-[#183422]">
                                <tr>
                                    <th className="px-6 py-3">Hora</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Método</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.map(order => (
                                    <tr 
                                        key={order.id} 
                                        onClick={() => setSelectedOrder(order)}
                                        className={`cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/5 border-l-4 border-transparent'}`}
                                    >
                                        <td className="px-6 py-4 text-white font-mono text-sm">
                                            {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">{order.customerName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                                                order.paymentMethod === 'card' ? 'text-blue-300 bg-blue-500/10' : 'text-green-300 bg-green-500/10'
                                            }`}>
                                                <span className="material-symbols-outlined text-[14px]">
                                                    {order.paymentMethod === 'card' ? 'credit_card' : 'payments'}
                                                </span>
                                                {order.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-right font-mono font-bold">${order.total?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">PAGADO</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <div className="bg-[#102316] border border-white/10 rounded-xl p-6 h-fit sticky top-6">
                {selectedOrder ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-start border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-white text-xl font-bold">Detalle de Venta</h3>
                                <p className="text-primary font-mono text-sm">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-secondary text-xs uppercase font-bold">Fecha</p>
                                <p className="text-white text-sm">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-primary">{item.quantity}x</span>
                                        <span className="text-white">{item.name}</span>
                                    </div>
                                    <span className="text-white font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-2">
                            <div className="flex justify-between text-secondary text-sm">
                                <span>Subtotal</span>
                                <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-secondary text-sm">
                                <span>Impuestos</span>
                                <span>${selectedOrder.tax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-white text-xl font-bold pt-2">
                                <span>Total Pagado</span>
                                <span>${selectedOrder.total?.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowTicketModal(true)}
                            className="w-full bg-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
                        >
                            <span className="material-symbols-outlined">print</span>
                            Reimprimir Ticket
                        </button>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-secondary opacity-50">
                        <span className="material-symbols-outlined text-5xl mb-2">receipt</span>
                        <p>Selecciona una venta para ver detalles</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {showTicketModal && selectedOrder && (
          <TicketModal 
            order={selectedOrder} 
            title="REIMPRESIÓN DE TICKET" 
            onClose={() => setShowTicketModal(false)} 
          />
      )}

      {showSummaryModal && (
          <TicketModal 
            order={{ createdAt: selectedDate }} 
            title="CORTE DE CAJA" 
            onClose={() => setShowSummaryModal(false)} 
          />
      )}
    </main>
  );
};