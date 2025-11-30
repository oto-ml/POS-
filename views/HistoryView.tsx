import React from 'react';
import { MOCK_ORDERS } from '../constants';

export const HistoryView: React.FC = () => {
  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-white text-4xl font-black">Historial de Pedidos</h1>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-secondary">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input 
            type="text" 
            className="w-full bg-[#22492f] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-secondary focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Buscar por ID de pedido o nombre de cliente"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Panel */}
        <div className="lg:col-span-1 space-y-6">
            <h3 className="text-white text-lg font-bold">Filtros</h3>
            <div className="bg-[#102316] border border-white/10 rounded-xl p-4">
                <div className="mb-6">
                    <h4 className="text-gray-300 font-semibold mb-3 text-sm">Rango de Fechas</h4>
                    <div className="flex items-center justify-between mb-4">
                        <button className="text-white hover:bg-white/10 p-1 rounded-full"><span className="material-symbols-outlined">chevron_left</span></button>
                        <span className="font-bold text-white">Julio 2024</span>
                        <button className="text-white hover:bg-white/10 p-1 rounded-full"><span className="material-symbols-outlined">chevron_right</span></button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-sm">
                        {['D','L','M','X','J','V','S'].map(d => <span key={d} className="text-secondary font-bold py-2">{d}</span>)}
                        <span className="text-gray-600 py-2">30</span>
                        <span className="text-gray-600 py-2">1</span>
                        <span className="text-white py-2">2</span>
                        <span className="text-white py-2">3</span>
                        <span className="text-white py-2">4</span>
                        <span className="bg-primary text-background-dark rounded-full py-2 font-bold">5</span>
                        <span className="text-white py-2">6</span>
                    </div>
                </div>
                
                <div className="mb-6">
                     <h4 className="text-gray-300 font-semibold mb-3 text-sm">Estado del Pedido</h4>
                     <select className="w-full bg-[#22492f] text-white border-none rounded-lg p-2.5">
                        <option>Todos</option>
                        <option>Completado</option>
                        <option>Cancelado</option>
                     </select>
                </div>

                <button className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary-hover">Aplicar Filtros</button>
            </div>
        </div>

        {/* List & Details */}
        <div className="lg:col-span-2 flex gap-6">
             <div className="flex-1 bg-[#102316] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                <table className="w-full text-left">
                    <thead className="border-b border-white/10 bg-[#183422]">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-secondary uppercase">ID Pedido</th>
                            <th className="px-6 py-4 text-sm font-bold text-secondary uppercase">Cliente</th>
                            <th className="px-6 py-4 text-sm font-bold text-secondary uppercase text-right">Total</th>
                            <th className="px-6 py-4 text-sm font-bold text-secondary uppercase text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {MOCK_ORDERS.map(order => (
                            <tr key={order.id} className="hover:bg-white/5 cursor-pointer transition-colors">
                                <td className="px-6 py-4 text-sm text-secondary font-mono">{order.id}</td>
                                <td className="px-6 py-4 font-medium text-white">{order.customerName}</td>
                                <td className="px-6 py-4 font-medium text-white text-right">${order.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        order.status === 'Completado' ? 'bg-green-900 text-green-300' :
                                        order.status === 'Cancelado' ? 'bg-red-900 text-red-300' :
                                        'bg-yellow-900 text-yellow-300'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Details Panel (Right side overlay or column) - Simplified for layout */}
            <div className="hidden xl:block w-80 bg-[#102316] border border-white/10 rounded-xl p-6 h-fit">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-white text-lg font-bold">Detalles</h3>
                        <p className="text-primary font-mono text-sm">#A8B-234</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="border-b border-white/10 pb-4">
                        <p className="text-secondary text-xs uppercase font-bold mb-1">Cliente</p>
                        <p className="text-white font-medium">Carlos Vega</p>
                        <p className="text-secondary text-sm">carlos.vega@email.com</p>
                     </div>
                     <div>
                        <p className="text-secondary text-xs uppercase font-bold mb-3">Resumen</p>
                        <ul className="space-y-2">
                             <li className="flex justify-between text-sm">
                                <span className="text-white">1x Hamburguesa</span>
                                <span className="text-white">$12.00</span>
                             </li>
                             <li className="flex justify-between text-sm">
                                <span className="text-white">1x Papas</span>
                                <span className="text-white">$6.00</span>
                             </li>
                        </ul>
                     </div>
                     <div className="pt-4 border-t border-white/10 mt-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-white">$24.50</span>
                        </div>
                     </div>
                     <button className="w-full bg-primary text-background-dark font-bold py-2 rounded-lg flex items-center justify-center gap-2 mt-4">
                        <span className="material-symbols-outlined">print</span>
                        Reimprimir
                     </button>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
};