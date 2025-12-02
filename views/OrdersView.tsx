import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { OrderStatus, Order } from '../types';

export const OrdersView: React.FC = () => {
  const [readyOrders, setReadyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("status", "==", OrderStatus.READY),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setReadyOrders(ordersData);
      setLoading(false);
    }, (error) => { console.error("Error:", error); setLoading(false); });

    return () => unsubscribe();
  }, []);

  const handleDeliver = async (orderId: string) => {
    if(!confirm("¿Confirmar entrega al cliente?")) return;
    try {
      await updateDoc(doc(db, "orders", orderId), { status: OrderStatus.DELIVERED, updatedAt: serverTimestamp() });
    } catch (error) { console.error("Error:", error); }
  };

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <div className="size-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/30">
            <span className="material-symbols-outlined text-3xl">room_service</span>
        </div>
        <div>
            <h1 className="text-white text-3xl font-bold">Pedidos Listos</h1>
            <p className="text-secondary">Órdenes terminadas listas para entregar.</p>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-white gap-3">
            <span className="material-symbols-outlined animate-spin text-2xl text-primary">progress_activity</span>
            <span className="text-lg">Cargando...</span>
        </div>
      ) : readyOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-secondary opacity-50 border-2 border-dashed border-white/10 rounded-2xl">
            <span className="material-symbols-outlined text-6xl mb-4">check_circle_outline</span>
            <p className="text-xl">No hay pedidos pendientes de entrega</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {readyOrders.map((order) => (
            <div key={order.id} className="bg-surface-dark border-l-4 border-green-500 rounded-r-xl p-5 shadow-lg relative overflow-hidden group hover:bg-[#3E505B] transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform pointer-events-none">
                    <span className="material-symbols-outlined text-9xl text-green-500">check_circle</span>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border border-green-500/30">Listo para Servir</span>
                            <h3 className="text-white text-xl font-bold mt-2">{order.customerName || 'Cliente'}</h3>
                            <p className="text-secondary text-sm">#{order.id.slice(-4).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-white text-right">Para Llevar</span>
                            <span className="text-xs text-secondary uppercase font-bold">TAKEAWAY</span>
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-3 pt-3">
                        <ul className="space-y-1 text-sm text-gray-300 max-h-32 overflow-y-auto mb-4">
                            {order.items.map((item, i) => (
                                <li key={i} className="flex justify-between">
                                    <span>{item.quantity}x {item.name}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button onClick={() => handleDeliver(order.id)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/30">
                        <span className="material-symbols-outlined">done_all</span> Entregar
                    </button>
                </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};