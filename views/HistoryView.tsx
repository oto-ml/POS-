import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, doc, writeBatch, increment, serverTimestamp } from 'firebase/firestore';
import { Order, OrderStatus } from '../types';
import { getApp, initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const HistoryView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Modales
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Estado para devolución
  const [returnReason, setReturnReason] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // --- CARGAR DATOS ---
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);

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
      })) as Order[];

      setOrders(fetchedOrders);
      // Mantener seleccionado si existe, si no resetear
      if (selectedOrder) {
          const updatedSelected = fetchedOrders.find(o => o.id === selectedOrder.id);
          setSelectedOrder(updatedSelected || null);
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedDate]);

  // --- PROCESAR DEVOLUCIÓN ---
  const handleAuthorizeReturn = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedOrder) return;
      if (!returnReason || !adminEmail || !adminPassword) return alert("Todos los campos son obligatorios");

      setIsAuthorizing(true);
      let secondaryApp: any = null;

      try {
          // 1. Validar credenciales de Gerente (Creando app secundaria para no desloguear al cajero)
          const config = getApp().options;
          secondaryApp = initializeApp(config, "AuthApp");
          const secondaryAuth = getAuth(secondaryApp);
          
          const userCred = await signInWithEmailAndPassword(secondaryAuth, adminEmail, adminPassword);
          
          // Verificar si es admin en Firestore (Opcional, por ahora basta con que tenga login)
          // ... lógica adicional de seguridad aquí ...

          // 2. Ejecutar Devolución (Transacción Batch)
          const batch = writeBatch(db);
          
          // A) Actualizar Orden
          const orderRef = doc(db, "orders", selectedOrder.id);
          batch.update(orderRef, {
              status: OrderStatus.RETURNED,
              returnReason: returnReason,
              authorizedBy: userCred.user.email,
              returnedAt: serverTimestamp()
          });

          // B) Devolver Stock
          selectedOrder.items.forEach(item => {
              const productRef = doc(db, "products", item.id);
              batch.update(productRef, {
                  stock: increment(item.quantity)
              });
          });

          // C) Registrar Auditoría
          const auditRef = doc(collection(db, "audit_logs"));
          batch.set(auditRef, {
              action: "RETURN_PROCESSED",
              orderId: selectedOrder.id,
              authorizedBy: userCred.user.email,
              reason: returnReason,
              amount: selectedOrder.total,
              timestamp: serverTimestamp()
          });

          await batch.commit();

          alert("Devolución procesada correctamente. Inventario restaurado.");
          setShowReturnModal(false);
          // Limpiar formulario
          setAdminEmail(''); setAdminPassword(''); setReturnReason('');
          fetchOrders(); // Recargar datos

      } catch (error: any) {
          console.error(error);
          alert("Error de autorización: " + error.message);
      } finally {
          if (secondaryApp) deleteApp(secondaryApp);
          setIsAuthorizing(false);
      }
  };

  // --- CÁLCULOS (Excluyendo devoluciones) ---
  const validOrders = orders.filter(o => o.status !== OrderStatus.RETURNED);
  const returnedOrders = orders.filter(o => o.status === OrderStatus.RETURNED);

  const dailySummary = {
      grossSales: orders.reduce((sum, o) => sum + (o.status !== OrderStatus.RETURNED ? (o.total || 0) : 0), 0),
      returnsTotal: returnedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
      netSales: 0, // Se calcula abajo
      totalOrders: validOrders.length,
      cashTotal: validOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + (o.total || 0), 0),
      cardTotal: validOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + (o.total || 0), 0),
  };
  dailySummary.netSales = dailySummary.grossSales; // Net sales son las ventas válidas (ya filtramos arriba)

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

  const TicketModal = ({ order, onClose, title }: { order: any, onClose: () => void, title: string }) => {
    const isReturnTicket = order.status === OrderStatus.RETURNED;

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-white text-black w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 text-center border-b-2 border-dashed border-gray-300">
                <h2 className="text-xl font-black uppercase mb-1">Restaurante Upiicsa</h2>
                <p className="text-xs font-mono text-gray-500">{title}</p>
                {isReturnTicket && <p className="text-sm font-bold mt-1">*** DEVOLUCIÓN ***</p>}
                
                <div className="mt-4 text-left font-mono text-xs">
                    <p>Fecha Original: {order.createdAt ? formatDate(order.createdAt) : '-'}</p>
                    {isReturnTicket && <p>Fecha Devolución: {order.returnedAt ? formatDate(order.returnedAt) : 'Hoy'}</p>}
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
                            <span>Ventas Efectivo</span>
                            <span>${dailySummary.cashTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Ventas Tarjeta</span>
                            <span>${dailySummary.cardTotal.toFixed(2)}</span>
                        </div>
                        
                        {dailySummary.returnsTotal > 0 && (
                            <div className="flex justify-between text-red-600">
                                <span>(-) Devoluciones</span>
                                <span>-${dailySummary.returnsTotal.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="border-t border-dashed border-gray-400 my-2"></div>
                        <div className="flex justify-between text-lg font-black">
                            <span>VENTA NETA</span>
                            <span>${dailySummary.netSales.toFixed(2)}</span>
                        </div>
                        <div className="mt-4 text-center text-gray-500">
                            Transacciones Válidas: {dailySummary.totalOrders}
                        </div>
                    </div>
                ) : (
                    <>
                        <table className="w-full mb-4">
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
                                        <td className="py-2 align-top text-right">
                                            {isReturnTicket ? '-' : ''}${ (item.price * item.quantity).toFixed(2) }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {isReturnTicket && (
                            <div className="border-t border-black pt-2 mb-4">
                                <p className="font-bold">Motivo:</p>
                                <p className="italic">{order.returnReason}</p>
                                <p className="mt-1 font-bold">Autorizó:</p>
                                <p>{order.authorizedBy}</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {title !== 'CORTE DE CAJA' && (
                <div className="p-6 bg-gray-50 border-t-2 border-dashed border-gray-300 font-mono text-xs">
                    <div className="flex justify-between text-lg font-bold">
                        <span>{isReturnTicket ? 'REEMBOLSO TOTAL' : 'TOTAL'}</span>
                        <span>{isReturnTicket ? '-' : ''}${order.total?.toFixed(2)}</span>
                    </div>
                    <p className="mt-2">Método: {order.paymentMethod === 'card' ? `Tarjeta` : 'Efectivo'}</p>
                </div>
            )}

            <div className="p-4 bg-gray-100 border-t border-gray-200 print:hidden text-center flex flex-col gap-2">
                <button onClick={() => window.print()} className="bg-black text-white py-3 rounded font-bold hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined align-middle mr-2">print</span>
                    Imprimir
                </button>
                <button onClick={onClose} className="text-gray-600 font-bold py-2 hover:bg-gray-200 rounded transition-colors">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
    );
  };

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="max-w-[1600px] mx-auto h-full flex flex-col">
        
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-white text-4xl font-black">Historial de Ventas</h1>
            
            <div className="flex items-center gap-4 bg-surface-dark p-2 rounded-xl border border-white/5 shadow-md">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <div className="text-center px-4">
                    <p className="text-secondary text-xs font-bold uppercase tracking-wider">Viendo fecha</p>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_today</span>
                        <span className="text-white font-bold text-lg">
                            {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </div>
                <button onClick={() => changeDate(1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            <button 
                onClick={() => setShowSummaryModal(true)}
                className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-primary-hover flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
            >
                <span className="material-symbols-outlined">receipt_long</span>
                Corte del Día
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
            {/* Lista de Ventas */}
            <div className="lg:col-span-2 bg-surface-dark border border-white/5 rounded-xl overflow-hidden flex flex-col shadow-xl">
                <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                    <h3 className="font-bold text-white">Transacciones ({orders.length})</h3>
                    <div className="text-right">
                        <span className="text-secondary text-xs block">VENTA NETA</span>
                        <span className="text-primary font-mono font-bold text-lg">${dailySummary.netSales.toFixed(2)}</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40 text-white">
                            <span className="material-symbols-outlined animate-spin mr-2 text-primary">refresh</span> Cargando...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-secondary opacity-50 p-10">
                            <span className="material-symbols-outlined text-6xl mb-4">event_busy</span>
                            <p>No hay movimientos en esta fecha.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="text-secondary text-xs uppercase font-bold sticky top-0 bg-surface-darker shadow-sm">
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
                                        className={`cursor-pointer transition-all ${selectedOrder?.id === order.id ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-white/5 border-l-4 border-transparent'} ${order.status === OrderStatus.RETURNED ? 'opacity-60 grayscale' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-white font-mono text-sm">
                                            {order.createdAt ? new Date(order.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {order.customerName}
                                            {order.status === OrderStatus.RETURNED && <span className="block text-xs text-red-400 font-bold">DEVOLUCIÓN</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase ${
                                                order.paymentMethod === 'card' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20' : 'text-green-300 bg-green-500/10 border border-green-500/20'
                                            }`}>
                                                {order.paymentMethod === 'card' ? 'Tarjeta' : 'Efectivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-right font-mono font-bold">
                                            {order.status === OrderStatus.RETURNED ? '-' : ''}${order.total?.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {order.status === OrderStatus.RETURNED ? (
                                                <span className="px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">DEVUELTO</span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">PAGADO</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Panel de Detalle (Derecha) */}
            <div className="bg-surface-dark border border-white/5 rounded-xl p-6 h-fit sticky top-6 shadow-xl">
                {selectedOrder ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-start border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-white text-xl font-bold">Detalle</h3>
                                <p className="text-primary font-mono text-sm">#{selectedOrder.id.slice(-6).toUpperCase()}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-secondary text-xs uppercase font-bold">Fecha</p>
                                <p className="text-white text-sm">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm group">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-primary bg-primary/10 px-2 rounded">{item.quantity}x</span>
                                        <span className="text-white">{item.name}</span>
                                    </div>
                                    <span className="text-white font-mono font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        {selectedOrder.status === OrderStatus.RETURNED && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-300 text-xs font-bold uppercase mb-1">Devolución Procesada</p>
                                <p className="text-white text-sm italic">"{selectedOrder.returnReason}"</p>
                                <p className="text-secondary text-xs mt-1">Autorizó: {selectedOrder.authorizedBy}</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10 space-y-2">
                            <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-white/5 mt-2">
                                <span>Total</span>
                                <span className={selectedOrder.status === OrderStatus.RETURNED ? 'text-red-400 line-through' : 'text-primary'}>
                                    ${selectedOrder.total?.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => setShowTicketModal(true)}
                                className="w-full bg-white/5 text-white font-bold py-3 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10 shadow-sm"
                            >
                                <span className="material-symbols-outlined">print</span>
                                {selectedOrder.status === OrderStatus.RETURNED ? 'Imprimir Ticket Devolución' : 'Reimprimir Ticket'}
                            </button>

                            {selectedOrder.status !== OrderStatus.RETURNED && (
                                <button 
                                    onClick={() => setShowReturnModal(true)}
                                    className="w-full bg-red-500/10 text-red-400 font-bold py-3 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                                >
                                    <span className="material-symbols-outlined">undo</span>
                                    Realizar Devolución
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-secondary opacity-50">
                        <div className="size-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl">receipt</span>
                        </div>
                        <p>Selecciona una venta para ver detalles</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Modales */}
      {showTicketModal && selectedOrder && (
          <TicketModal 
            order={selectedOrder} 
            title={selectedOrder.status === OrderStatus.RETURNED ? "TICKET DE DEVOLUCIÓN" : "REIMPRESIÓN DE TICKET"} 
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

      {/* Modal de Autorización de Devolución */}
      {showReturnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="bg-surface-dark w-full max-w-md rounded-xl p-6 shadow-2xl border border-white/10">
                  <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-red-400">admin_panel_settings</span>
                      Autorización Requerida
                  </h3>
                  <p className="text-secondary text-sm mb-4">Solo un gerente puede autorizar devoluciones. Esto descontará el dinero de caja y restaurará el inventario.</p>
                  
                  <form onSubmit={handleAuthorizeReturn} className="space-y-4">
                      <div>
                          <label className="text-secondary text-xs font-bold uppercase block mb-1">Motivo de Devolución</label>
                          <input type="text" required autoFocus className="w-full bg-black/20 text-white p-3 rounded-lg border border-white/10 focus:border-red-400 outline-none" 
                              placeholder="Ej. Cliente insatisfecho, error de cobro..."
                              value={returnReason} onChange={e => setReturnReason(e.target.value)} />
                      </div>
                      
                      <div className="border-t border-white/10 pt-4">
                          <p className="text-white text-sm font-bold mb-2">Credenciales de Gerente</p>
                          <input type="email" required className="w-full bg-black/20 text-white p-3 rounded-lg border border-white/10 mb-2 focus:border-primary outline-none" 
                              placeholder="Correo de Gerente"
                              value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                          <input type="password" required className="w-full bg-black/20 text-white p-3 rounded-lg border border-white/10 focus:border-primary outline-none" 
                              placeholder="Contraseña"
                              value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setShowReturnModal(false)} className="px-4 py-2 text-gray-300 font-bold hover:text-white">Cancelar</button>
                          <button type="submit" disabled={isAuthorizing} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 shadow-lg disabled:opacity-50 flex items-center gap-2">
                              {isAuthorizing ? 'Procesando...' : 'Autorizar Devolución'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};