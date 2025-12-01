import React from 'react';
import { ViewState, UserRole, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole?: UserRole; // Rol del usuario (admin o cashier)
  user?: UserProfile; // Datos del usuario autenticado
  onLogout: () => void; // Función para cerrar sesión
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, user, onLogout }) => {
  
  // Definimos los items del menú según el rol
  let menuItems: Array<{ icon: string; label: string; value: string }> = [];

  if (userRole === 'cook') {
    // Cocineros solo ven su dashboard (no navegable, pero lo dejamos para consistencia)
    menuItems = [
      { icon: 'restaurant', label: 'Mi Cocina', value: 'KITCHEN' },
    ];
  } else {
    // Admin y Cajero
    menuItems = [
      { icon: 'receipt_long', label: 'Pedidos (POS)', value: 'POS' },
      { icon: 'restaurant_menu', label: 'Cocina (KDS)', value: 'KITCHEN' },
      { icon: 'inventory_2', label: 'Inventario', value: 'INVENTORY' },
    ];

    // Si es ADMIN, agregamos "Historial"
    if (userRole === 'admin') {
      menuItems.push({ icon: 'history', label: 'Historial', value: 'HISTORY' });
    }
  }

  return (
    <aside className="flex h-full w-20 lg:w-64 flex-col justify-between border-r border-[#22492f]/50 bg-surface-darker p-4 transition-all duration-300">
      <div className="flex flex-col gap-8">
        {/* Logo y Título */}
        <div className="flex items-center gap-3 px-2">
           <span className="material-symbols-outlined text-primary text-3xl">point_of_sale</span>
           <h2 className="text-white text-xl font-bold hidden lg:block">Restaurante</h2>
        </div>

        {/* Información del Usuario (Solo en modo expandido) */}
        {user && (
          <div className="hidden lg:flex flex-col gap-2 rounded-lg bg-[#22492f]/30 p-3 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                <p className="text-secondary text-xs truncate">{user.email}</p>
              </div>
            </div>
            <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md text-center font-medium">
              {user.role === 'admin' ? '👑 Administrador' : user.role === 'cook' ? '👨‍🍳 Cocinero' : '💼 Cajero'}
            </div>
          </div>
        )}

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
        
        {/* Botón de Ajustes (Visible para todos: admin y cashier) */}
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