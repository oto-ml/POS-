import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import { OrderStatus, MenuItem } from '../types';

export const CookDashboardView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [products, setProducts] = useState<MenuItem[]>([]);
    const [activeTab, setActiveTab] = useState<'orders' | 'stock'>('orders');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [filter, setFilter] = useState<'all' | 'urgent' | 'pending'>('pending');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Reloj de la cocina
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Cargar pedidos en tiempo real
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

                return {
                    id: doc.id,
                    ...data,
                    displayTime: timeString
                };
            });
            setOrders(loadedOrders);
        });

        return () => unsubscribe();
    }, []);

    // Cargar productos (stock) de solo lectura
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const items = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as MenuItem[];
                setProducts(items);
            } catch (error) {
                console.error("Error cargando stock:", error);
            }
        };

        fetchProducts();
    }, []);

    // Marcar como listo (solo cocinero puede hacer esto)
    const markAsReady = async (orderId: string) => {
        setUpdatingOrderId(orderId);
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: OrderStatus.READY
            });
            console.log(`Pedido ${orderId} marcado como listo`);
        } catch (error: any) {
            console.error("Error al marcar como listo:", error);
            alert(`Error: ${error.message || 'Error de conexión'}`);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // Filtrar órdenes según urgencia y estado
    const getFilteredOrders = () => {
        const now = Date.now();
        return orders.filter(order => {
            if (filter === 'all') return true;
            if (filter === 'urgent') {
                const createdAt = (order.createdAt as Timestamp).toDate().getTime();
                const elapsedMinutes = (now - createdAt) / (1000 * 60);
                return elapsedMinutes >= 2; // Urgente a partir de 2 minutos
            }
            if (filter === 'pending') {
                return order.status === OrderStatus.PREPARING; // Solo órdenes en preparación
            }
            return true;
        });
    };

    // Calcular si es urgente (>= 2 minutos)
    const isUrgent = (createdAt: Timestamp): boolean => {
        const now = Date.now();
        const orderTime = (createdAt as Timestamp).toDate().getTime();
        const elapsedMinutes = (now - orderTime) / (1000 * 60);
        return elapsedMinutes >= 2;
    };

    // Calcular tiempo transcurrido
    const getElapsedTime = (createdAt: Timestamp) => {
        const now = new Date();
        const orderTime = (createdAt as Timestamp).toDate();
        const diffMs = now.getTime() - orderTime.getTime();
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const filteredOrders = getFilteredOrders();

    return (
        <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className="size-12 text-primary rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">restaurant</span>
                        </div>
                        <div>
                            <h1 className="text-white text-3xl font-bold">Cocina - Dashboard</h1>
                            <p className="text-secondary text-sm">Gestión de pedidos y consulta de stock</p>
                        </div>
                    </div>
                    <div className="flex items-center bg-surface-dark px-4 py-2 rounded-lg gap-3 border border-white/10">
                        <span className="material-symbols-outlined text-white">schedule</span>
                        <span className="text-white font-mono font-bold text-lg">{currentTime.toLocaleTimeString()}</span>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
                            activeTab === 'orders'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined">receipt_long</span>
                            Pedidos ({orders.length})
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
                            activeTab === 'stock'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-secondary hover:text-white'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined">inventory_2</span>
                            Stock ({products.length})
                        </span>
                    </button>
                </div>

                {/* Vista de Pedidos */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {/* Filtros */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('pending')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                    filter === 'pending'
                                        ? 'bg-primary text-background-dark'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Pendientes
                            </button>
                            <button
                                onClick={() => setFilter('urgent')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                    filter === 'urgent'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Urgentes
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                                    filter === 'all'
                                        ? 'bg-primary text-background-dark'
                                        : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                            >
                                Todos
                            </button>
                        </div>

                        {/* Grid de Órdenes */}
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                                <h2 className="text-2xl font-bold">Todo listo</h2>
                                <p>No hay pedidos pendientes en cocina.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredOrders.map((order, index) => {
                                    const elapsedTime = getElapsedTime(order.createdAt);
                                    const urgent = isUrgent(order.createdAt);

                                    return (
                                        <div
                                            key={order.id}
                                            className={`flex flex-col rounded-xl border-2 p-4 transition-all ${
                                                urgent ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'
                                            }`}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary text-background-dark font-bold text-sm">
                                                            {index + 1}
                                                        </span>
                                                        <p className="text-primary text-sm font-bold">
                                                            ID: {order.id.slice(-4).toUpperCase()}
                                                        </p>
                                                    </div>
                                                    <p className="text-white text-lg font-bold mt-2">{order.customerName}</p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                                    urgent ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                                                }`}>
                                                    {elapsedTime}
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="flex-1 space-y-2 mb-4 p-3 bg-white/5 rounded-lg border border-white/10 max-h-64 overflow-y-auto">
                                                {order.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-bold line-clamp-1">{item.name}</p>
                                                            {item.notes && (
                                                                <p className="text-yellow-300 text-xs italic">📝 {item.notes}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-primary font-bold text-lg shrink-0">×{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                                                <p className="text-blue-300 text-sm font-bold">
                                                    {order.status === 'Pendiente' ? '⏳ Pendiente' : '👨‍🍳 Preparando'}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() => markAsReady(order.id)}
                                                disabled={updatingOrderId === order.id}
                                                className="w-full bg-green-500/20 hover:bg-green-500 hover:disabled:bg-green-500/20 text-green-300 hover:text-white border-2 border-green-500/50 hover:border-green-500 font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <span className="flex items-center justify-center gap-2">
                                                    {updatingOrderId === order.id ? (
                                                        <>
                                                            <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                                            Actualizando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined">check_circle</span>
                                                            Marcar como Listo
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Vista de Stock (Solo Lectura) */}
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-blue-300 text-sm">
                                <span className="material-symbols-outlined text-base align-middle mr-2">info</span>
                                Esta es una vista de consulta. No puedes modificar el stock desde aquí.
                            </p>
                        </div>

                        <div className="bg-[#183422] rounded-xl border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#0f1f15] text-gray-500 text-xs uppercase font-bold tracking-wider">
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
                                            let statusColor = 'bg-green-500/20 text-green-400 border-green-500/50';
                                            let statusLabel = 'En Stock';

                                            if (stock === 0) {
                                                statusColor = 'bg-red-500/20 text-red-400 border-red-500/50';
                                                statusLabel = 'Agotado';
                                            } else if (stock < 20) {
                                                statusColor = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
                                                statusLabel = 'Poco Stock';
                                            }

                                            return (
                                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="size-10 rounded-md bg-white/5 bg-cover bg-center border border-white/10"
                                                                style={{ backgroundImage: `url('${item.image}')` }}
                                                            />
                                                            <span className="text-white font-bold">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">{item.category}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-bold text-lg">{stock}</span>
                                                            <div className="h-1.5 bg-gray-700/50 rounded-full w-16 overflow-hidden">
                                                                <div
                                                                    className={`h-full rounded-full transition-all ${
                                                                        stock === 0 ? 'bg-red-500' : stock < 20 ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(stock, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {products.length === 0 && (
                                <div className="p-8 text-center text-secondary">
                                    No hay productos en el inventario.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};
