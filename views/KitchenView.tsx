import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Order, OrderStatus } from '../types';

export const KitchenView: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Reloj en tiempo real
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Escuchar pedidos en tiempo real desde Firestore
    useEffect(() => {
        const q = query(
            collection(db, "orders"),
            where("status", "==", OrderStatus.PREPARING), // Solo pedidos pendientes/preparando
            orderBy("createdAt", "asc") // Los más viejos primero
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Order[];
            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error obteniendo pedidos de cocina:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Función para marcar como listo
    const handleMarkReady = async (orderId: string) => {
        // --- ACTUALIZACIÓN OPTIMISTA ---
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));

        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: OrderStatus.READY, // Cambiamos el estado a 'Listo' en la BD
                updatedAt: serverTimestamp() // Importante: registramos cuándo salió
            });
        } catch (error) {
            console.error("Error actualizando pedido:", error);
            alert("Error al actualizar el estado del pedido.");
        }
    };

    // Calcular tiempo transcurrido
    const getElapsedTime = (timestamp: any) => {
        if (!timestamp) return "00:00";
        // Convertimos el Timestamp de Firestore a Date de JS
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Math.floor((currentTime.getTime() - date.getTime()) / 1000);
        
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Determinar estilo basado en tiempo de espera
    const getStatusStyle = (timestamp: any) => {
        if (!timestamp) return 'normal';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffMinutes = (currentTime.getTime() - date.getTime()) / 1000 / 60;
        
        if (diffMinutes > 15) return 'late'; // Rojo si lleva más de 15 min
        if (diffMinutes > 8) return 'warning'; // Amarillo si lleva más de 8 min
        return 'normal';
    };

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
                <div className="size-8 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path></svg>
                </div>
                <h1 className="text-white text-3xl font-bold">Vista de Cocina (KDS)</h1>
            </div>
            <div className="flex items-center bg-surface-dark px-4 py-2 rounded-lg gap-3 border border-white/10">
                 <span className="material-symbols-outlined text-white">schedule</span>
                 <span className="text-white font-mono font-bold text-lg">{currentTime.toLocaleTimeString()}</span>
            </div>
        </header>

        {/* Filtros Visuales */}
        <div className="flex gap-4 mb-8">
            <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg">Todos ({orders.length})</button>
            <div className="flex items-center gap-2 ml-auto text-sm text-secondary">
                <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-red-500/20 border border-red-500"></span> +15 min</span>
                <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-yellow-500/20 border border-yellow-500"></span> +8 min</span>
            </div>
        </div>

        {loading ? (
            <div className="flex justify-center items-center h-64 text-white">
                <span className="material-symbols-outlined animate-spin text-4xl">refresh</span>
                <span className="ml-2">Cargando pedidos...</span>
            </div>
        ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-secondary opacity-50 border-2 border-dashed border-white/10 rounded-xl">
                <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                <p className="text-xl font-bold">¡Todo limpio, Chef!</p>
                <p>No hay pedidos pendientes en este momento.</p>
            </div>
        ) : (
            /* Grid de Pedidos */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {orders.map((ticket) => {
                    const statusStyle = getStatusStyle(ticket.createdAt); 
                    const elapsedTime = getElapsedTime(ticket.createdAt);

                    return (
                        <div 
                            key={ticket.id} 
                            className={`flex flex-col rounded-xl bg-[#22492f]/30 p-4 border-2 transition-all ${
                                statusStyle === 'late' ? 'border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 
                                statusStyle === 'warning' ? 'border-yellow-500/50' : 
                                'border-transparent hover:border-white/20'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-primary text-sm font-medium flex items-center gap-1">
                                        {ticket.type === 'Dine-in' ? <span className="material-symbols-outlined text-sm">restaurant</span> : <span className="material-symbols-outlined text-sm">shopping_bag</span>}
                                        {ticket.type === 'Dine-in' ? `Mesa ${ticket.tableNumber}` : 'Para Llevar'}
                                    </p>
                                    <p className="text-white text-lg font-bold truncate w-40" title={ticket.customerName}>
                                        {ticket.customerName || 'Cliente'}
                                    </p>
                                    <p className="text-xs text-secondary font-mono">#{ticket.id.slice(-4).toUpperCase()}</p>
                                </div>
                                <div className={`px-3 py-1 rounded-md font-bold font-mono text-lg flex items-center gap-1 ${
                                    statusStyle === 'late' ? 'bg-red-500/20 text-red-400' :
                                    statusStyle === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-white/10 text-white'
                                }`}>
                                    <span className="material-symbols-outlined text-sm">timer</span>
                                    {elapsedTime}
                                </div>
                            </div>

                            <div className="border-t border-white/10 my-2"></div>

                            <ul className="flex-1 space-y-3 py-2 overflow-y-auto max-h-[200px]">
                                {ticket.items.map((item, i) => (
                                    <li key={i} className="text-white text-sm">
                                        <div className="flex items-start">
                                            <span className="font-black mr-2 text-lg bg-white/10 px-2 rounded">{item.quantity}</span>
                                            <div className="flex-1">
                                                <span>{item.name}</span>
                                                {item.notes && (
                                                    <div className="bg-yellow-500/10 text-yellow-300 p-1 rounded mt-1 text-xs font-bold flex items-start gap-1">
                                                        <span className="material-symbols-outlined text-[10px] mt-0.5">edit_note</span>
                                                        {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <button 
                                onClick={() => handleMarkReady(ticket.id)}
                                className="mt-4 w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                Marcar como Listo
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
    </main>
  );
};