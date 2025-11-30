import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { OrderStatus } from '../types';

export const KitchenView: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Reloj de la cocina
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Conexión a Firebase en tiempo real
    useEffect(() => {
        // Consultamos solo los pedidos que están "Preparando" o "Pendientes"
        const q = query(
            collection(db, "orders"), 
            where("status", "in", [OrderStatus.PREPARING, OrderStatus.PENDING]),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedOrders = snapshot.docs.map(doc => {
                const data = doc.data();
                // Convertir Timestamp de Firebase a string de hora legible
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

    const markAsReady = async (orderId: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: OrderStatus.READY
            });
            // No necesitas actualizar el estado local manualmente, 
            // onSnapshot lo hará automáticamente al detectar el cambio.
        } catch (error) {
            console.error("Error al actualizar ticket:", error);
            alert("Error de conexión");
        }
    };

    return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
                <div className="size-8 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path></svg>
                </div>
                <h1 className="text-white text-3xl font-bold">Comandas en Cocina</h1>
            </div>
            <div className="flex items-center bg-surface-dark px-4 py-2 rounded-lg gap-3 border border-white/10">
                 <span className="material-symbols-outlined text-white">schedule</span>
                 <span className="text-white font-mono font-bold text-lg">{currentTime.toLocaleTimeString()}</span>
            </div>
        </header>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
            <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg">Pendientes</button>
            <button className="bg-white/10 text-white font-medium px-6 py-2 rounded-lg hover:bg-white/20">Urgentes</button>
        </div>

        {/* Grid de Tickets */}
        {orders.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                <h2 className="text-2xl font-bold">Todo al día</h2>
                <p>No hay pedidos pendientes en cocina.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {orders.map((ticket) => (
                    <div 
                        key={ticket.id} 
                        className="flex flex-col rounded-xl bg-[#22492f]/30 p-4 border-2 border-transparent hover:border-white/10 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-primary text-sm font-medium">
                                    Mesa {ticket.tableNumber} • ID: {ticket.id.slice(-4).toUpperCase()}
                                </p>
                                <p className="text-white text-xl font-bold">{ticket.customerName}</p>
                            </div>
                            <div className="bg-white/10 text-white px-3 py-1 rounded-md font-bold font-mono text-lg">
                                {ticket.displayTime}
                            </div>
                        </div>

                        <div className="border-t border-white/10 my-2"></div>

                        <ul className="flex-1 space-y-3 py-2 overflow-y-auto max-h-[200px]">
                            {ticket.items.map((item: any, i: number) => (
                                <li key={i} className="text-white flex justify-between items-start">
                                    <span className="flex-1">
                                        <span className="font-bold mr-2 text-primary">{item.quantity}x</span>
                                        {item.name}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => markAsReady(ticket.id)}
                            className="mt-4 w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">done_all</span>
                            Marcar como Listo
                        </button>
                    </div>
                ))}
            </div>
        )}
    </main>
  );
};