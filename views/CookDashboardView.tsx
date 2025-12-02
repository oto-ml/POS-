import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, getDocs, serverTimestamp } from 'firebase/firestore';
import { OrderStatus, MenuItem } from '../types';

export const CookDashboardView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [filter, setFilter] = useState<'all' | 'urgent' | 'pending'>('pending');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, "orders"), 
            where("status", "in", [OrderStatus.PREPARING, OrderStatus.PENDING]),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                let timeString = 'Reciente';
                if (data.createdAt) {
                    const date = (data.createdAt as Timestamp).toDate();
                    timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
                return { id: doc.id, ...data, displayTime: timeString };
            });
            setOrders(loadedOrders);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
                setProducts(items);
            } catch (error) { console.error("Error:", error); }
        };
        fetchProducts();
    }, []);

    const markAsReady = async (orderId: string) => {
        setUpdatingOrderId(orderId);
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: OrderStatus.READY,
                updatedAt: serverTimestamp()
            });
        } catch (error: any) { alert(`Error: ${error.message}`); } 
        finally { setUpdatingOrderId(null); }
    };

    const getFilteredOrders = () => {
        const now = Date.now();
        return orders.filter(order => {
            if (filter === 'all') return true;
            if (filter === 'urgent') {
                const createdAt = (order.createdAt as Timestamp).toDate().getTime();
                return (now - createdAt) / (1000 * 60) >= 2;
            }
            return order.status === OrderStatus.PREPARING;
        });
    };

    const isUrgent = (createdAt: Timestamp) => {
        const now = Date.now();
        return (now - createdAt.toDate().getTime()) / (1000 * 60) >= 2;
    };

    const getElapsedTime = (createdAt: Timestamp) => {
        const now = new Date();
        const diffMs = now.getTime() - createdAt.toDate().getTime();
        return `${Math.floor(diffMs / 60000)}:${Math.floor((diffMs % 60000) / 1000).toString().padStart(2, '0')}`;
    };

    const filteredOrders = getFilteredOrders();

    return (
        <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">restaurant</span>
                        </div>
                        <div>
                            <h1 className="text-white text-3xl font-bold">Cocina - Dashboard</h1>
                            <p className="text-secondary text-sm">Gestión de pedidos y consulta de stock</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-surface-dark px-4 py-2 rounded-lg gap-3 border border-white/5">
                        <span className="material-symbols-outlined text-white">schedule</span>
                        <span className="text-white font-mono font-bold text-lg">{currentTime.toLocaleTimeString()}</span>
                    </div>
                </header>

                <div className="flex gap-2 mb-8 border-b border-white/5">
                    <button onClick={() => setActiveTab('orders')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-white'}`}>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined">receipt_long</span> Pedidos ({orders.length})</span>
                    </button>
                    <button onClick={() => setActiveTab('stock')} className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'stock' ? 'border-primary text-primary' : 'border-transparent text-secondary hover:text-white'}`}>
                        <span className="flex items-center gap-2"><span className="material-symbols-outlined">inventory_2</span> Stock ({products.length})</span>
                    </button>
                </div>

                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            {['pending', 'urgent', 'all'].map(f => (
                                <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-dark text-secondary hover:bg-white/10'}`}>
                                    {f === 'pending' ? 'Pendientes' : f === 'urgent' ? 'Urgentes' : 'Todos'}
                                </button>
                            ))}
                        </div>

                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                                <h2 className="text-2xl font-bold">Todo listo</h2>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredOrders.map((order, index) => {
                                    const urgent = isUrgent(order.createdAt);
                                    return (
                                        <div key={order.id} className={`flex flex-col rounded-xl border-2 p-4 transition-all bg-surface-dark ${urgent ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.15)]' : 'border-white/5'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary text-white font-bold text-sm">{index + 1}</span>
                                                        <p className="text-primary text-sm font-bold">#{order.id.slice(-4).toUpperCase()}</p>
                                                    </div>
                                                    <p className="text-white text-lg font-bold mt-2">{order.customerName}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${urgent ? 'bg-red-500/20 text-red-400' : 'bg-black/20 text-white'}`}>
                                                    {getElapsedTime(order.createdAt)}
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2 mb-4 p-3 bg-black/20 rounded-lg border border-white/5 max-h-64 overflow-y-auto">
                                                {order.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-bold line-clamp-1">{item.name}</p>
                                                            {item.notes && <p className="text-yellow-300 text-xs italic">📝 {item.notes}</p>}
                                                        </div>
                                                        <span className="text-primary font-bold text-lg shrink-0">×{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button onClick={() => markAsReady(order.id)} disabled={updatingOrderId === order.id} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-green-900/20 flex justify-center items-center gap-2">
                                                {updatingOrderId === order.id ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">check_circle</span>}
                                                {updatingOrderId === order.id ? 'Actualizando...' : 'Listo'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined">info</span> Solo lectura.
                        </div>
                        <div className="bg-surface-dark rounded-xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-black/20 text-secondary text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Stock</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-sm">
                                    {products.map(item => {
                                        const stock = item.stock || 0;
                                        return (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <div className="size-10 rounded-md bg-black/30 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                                                    <span className="text-white font-bold">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-400">{item.category}</td>
                                                <td className="px-6 py-4 font-bold text-white">{stock}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stock === 0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : stock < 20 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                                        {stock === 0 ? 'Agotado' : stock < 20 ? 'Bajo' : 'OK'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};