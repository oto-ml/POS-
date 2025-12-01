import React from 'react';
import { ViewState, UserRole } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole?: UserRole; // Rol del usuario (admin o cashier)
  onLogout: () => void; // Función para cerrar sesión
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, onLogout }) => {
  
  // 1. Definimos los items básicos del menú
  const menuItems = [
    { icon: 'receipt_long', label: 'Pedidos (POS)', value: 'POS' },
    { icon: 'restaurant_menu', label: 'Cocina (KDS)', value: 'KITCHEN' },
    // CAMBIO: Ahora mostramos Inventario en lugar de Órdenes
    { icon: 'inventory_2', label: 'Inventario', value: 'INVENTORY' },
  ];

  // 2. Si es ADMIN, agregamos "Historial" a la navegación principal
  if (userRole === 'admin') {
      menuItems.push({ icon: 'history', label: 'Historial', value: 'HISTORY' });
  }

  return (
    <aside className="flex h-full w-20 lg:w-64 flex-col justify-between border-r border-[#22492f]/50 bg-surface-darker p-4 transition-all duration-300">
      <div className="flex flex-col gap-8">
        {/* Logo y Título */}
        <div className="flex items-center gap-3 px-2">
           <span className="material-symbols-outlined text-primary text-3xl">point_of_sale</span>
           <h2 className="text-white text-xl font-bold hidden lg:block">Restaurante</h2>
        </div>

        {/* Navegación Principal Dinámica */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeView(item.value as ViewState)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                currentView === item.value 
                  ? 'bg-[#22492f] text-white' 
                  : 'text-secondary hover:bg-[#22492f]/50 hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-2xl ${currentView === item.value ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <p className="text-sm font-medium hidden lg:block">{item.label}</p>
            </button>
          ))}
        </nav>
      </div>

      {/* Menú Secundario (Inferior) */}
      <div className="flex flex-col gap-1">
        
        {/* Solo ADMIN ve el botón de Ajustes */}
        {userRole === 'admin' && (
            <button
                type="button"
                onClick={() => onChangeView('SETTINGS')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    currentView === 'SETTINGS' ? 'bg-[#22492f] text-white' : 'text-secondary hover:bg-[#22492f]/50 hover:text-white'
                }`}
            >
                <span className="material-symbols-outlined text-2xl">settings</span>
                <p className="text-sm font-medium hidden lg:block">Ajustes</p>
            </button>
        )}
        
        {/* Botón de Ayuda (Visible para todos) */}
        <button
            type="button"
            onClick={() => onChangeView('HELP')}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                currentView === 'HELP' ? 'bg-[#22492f] text-white' : 'text-secondary hover:bg-[#22492f]/50 hover:text-white'
            }`}
        >
            <span className="material-symbols-outlined text-2xl">help</span>
            <p className="text-sm font-medium hidden lg:block">Ayuda</p>
        </button>

        {/* Botón de Salir */}
        <button 
            type="button"
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-[#22492f]/50 hover:text-red-300 transition-colors mt-2"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <p className="text-sm font-medium hidden lg:block">Salir</p>
        </button>
      </div>
    </aside>
  );
};