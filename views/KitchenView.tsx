import React, { useState, useEffect } from 'react';
import { KITCHEN_TICKETS } from '../constants';

export const KitchenView: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div className="flex items-center gap-4">
                <div className="size-8 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z" fill="currentColor"></path></svg>
                </div>
                <h1 className="text-white text-3xl font-bold">Vista de Cocina</h1>
            </div>
            <div className="flex items-center bg-surface-dark px-4 py-2 rounded-lg gap-3 border border-white/10">
                 <span className="material-symbols-outlined text-white">schedule</span>
                 <span className="text-white font-mono font-bold text-lg">{currentTime.toLocaleTimeString()}</span>
            </div>
        </header>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
            <button className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg">Todos</button>
            <button className="bg-white/10 text-white font-medium px-6 py-2 rounded-lg hover:bg-white/20">Para Llevar</button>
            <button className="bg-white/10 text-white font-medium px-6 py-2 rounded-lg hover:bg-white/20">Comedor</button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {KITCHEN_TICKETS.map((ticket, idx) => (
                <div 
                    key={idx} 
                    className={`flex flex-col rounded-xl bg-[#22492f]/30 p-4 border-2 ${
                        ticket.status === 'late' ? 'border-red-500/60' : 
                        ticket.status === 'high' ? 'border-yellow-500/50' : 
                        'border-transparent'
                    }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-primary text-sm font-medium">
                                {ticket.type || `Mesa ${ticket.tableNumber}`} - {ticket.id}
                            </p>
                            <p className="text-white text-xl font-bold">{ticket.customerName}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-md font-bold font-mono text-lg ${
                            ticket.status === 'late' ? 'bg-red-500/20 text-red-400' :
                            ticket.status === 'high' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-white/10 text-white'
                        }`}>
                            {ticket.elapsedTime}
                        </div>
                    </div>

                    <div className="border-t border-white/10 my-2"></div>

                    <ul className="flex-1 space-y-3 py-2">
                        {ticket.items.map((item, i) => (
                            <li key={i} className="text-white">
                                <span className="font-bold mr-2">{item.quantity}x</span>
                                {item.name}
                                {item.notes && (
                                    <span className={`block text-sm font-semibold ml-6 ${
                                        ticket.status === 'high' ? 'text-yellow-400' : 'text-secondary'
                                    }`}>
                                        ({item.notes})
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <button className="mt-4 w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover transition-colors">
                        Marcar como Listo
                    </button>
                </div>
            ))}
        </div>
    </main>
  );
};