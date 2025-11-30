import React from 'react';

export const OrdersView: React.FC = () => {
  return (
    <main className="flex-1 p-4 lg:p-8 bg-background-dark overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
             <header className="flex items-center justify-between border-b border-white/20 pb-6 mb-8">
                <div className="flex items-center gap-4">
                     <div className="size-8 text-primary">
                        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path></svg>
                    </div>
                    <h1 className="text-white text-3xl font-black">Gestión de Pedidos</h1>
                </div>
                 <button className="bg-primary text-background-dark font-bold px-4 py-2 rounded-lg text-sm">Nuevo Pedido</button>
            </header>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                <button className="px-6 py-2 rounded-lg bg-primary/20 text-primary font-bold">Todos</button>
                <button className="px-6 py-2 rounded-lg bg-[#22492f] text-white font-medium">Preparando</button>
                <button className="px-6 py-2 rounded-lg bg-[#22492f] text-white font-medium">Listo</button>
                <button className="px-6 py-2 rounded-lg bg-[#22492f] text-white font-medium">Entregado</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Card 1 */}
                <div className="bg-[#183422] border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-white text-xl font-bold">Orden #1054 - Preparando</h3>
                            <p className="text-secondary text-sm mt-1">Hace 5 min</p>
                        </div>
                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-3 py-1 rounded-full">
                            <span className="material-symbols-outlined text-base">priority_high</span>
                            <span className="text-sm font-bold">Alta Prioridad</span>
                        </div>
                    </div>
                    <div className="border-t border-white/10 my-4"></div>
                    <div className="mb-4">
                        <p className="text-white text-base">2x Burger Clásica, 1x Papas Fritas...</p>
                        <p className="text-secondary text-sm mt-1">Nota: Sin cebolla, extra ketchup.</p>
                    </div>
                    <div className="flex justify-end">
                        <button className="bg-primary text-background-dark font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary-hover">Marcar como Listo</button>
                    </div>
                </div>

                {/* Order Card 2 */}
                 <div className="bg-[#183422] border border-white/5 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-white text-xl font-bold">Orden #1053 - Listo</h3>
                            <p className="text-secondary text-sm mt-1">Hace 12 min</p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 my-4"></div>
                    <div className="mb-4">
                        <p className="text-white text-base">1x Ensalada César, 1x Agua Mineral</p>
                        <p className="text-secondary text-sm mt-1">Nota: Ninguna.</p>
                    </div>
                    <div className="flex justify-end">
                        <button className="bg-primary text-background-dark font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary-hover">Marcar como Entregado</button>
                    </div>
                </div>

                {/* Order Card 3 */}
                <div className="bg-[#183422] border border-white/5 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-white text-xl font-bold">Orden #1052 - Preparando</h3>
                            <p className="text-secondary text-sm mt-1">Hace 15 min</p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 my-4"></div>
                    <div className="mb-4">
                        <p className="text-white text-base">3x Tacos al Pastor, 1x Horchata</p>
                        <p className="text-secondary text-sm mt-1">Nota: Extra piña.</p>
                    </div>
                    <div className="flex justify-end">
                        <button className="bg-primary text-background-dark font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary-hover">Marcar como Listo</button>
                    </div>
                </div>

                {/* Order Card 4 (Completed) */}
                <div className="bg-[#183422] border border-white/5 rounded-xl p-6 opacity-60">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-white text-xl font-bold">Orden #1051 - Entregado</h3>
                            <p className="text-secondary text-sm mt-1">Hace 25 min</p>
                        </div>
                    </div>
                    <div className="border-t border-white/10 my-4"></div>
                    <div className="mb-4">
                        <p className="text-white text-base">1x Pizza Margherita</p>
                    </div>
                    <div className="flex justify-end">
                        <button disabled className="bg-[#22492f] text-secondary font-bold px-4 py-2 rounded-lg text-sm cursor-not-allowed">Completado</button>
                    </div>
                </div>
            </div>
        </div>
    </main>
  );
};