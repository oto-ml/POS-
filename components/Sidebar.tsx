import React from 'react';
import { ViewState, UserRole, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  userRole?: UserRole;
  user?: UserProfile;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, userRole, user, onLogout }) => {
  
  let menuItems: Array<{ icon: string; label: string; value: string }> = [];

  if (userRole === 'cook') {
    menuItems = [
      { icon: 'restaurant', label: 'Mi Cocina', value: 'KITCHEN' },
    ];
  } else {
    menuItems = [
      { icon: 'receipt_long', label: 'Pedidos (POS)', value: 'POS' },
      { icon: 'notifications_active', label: 'Listos para Entregar', value: 'ORDERS' },
      { icon: 'restaurant_menu', label: 'Cocina (KDS)', value: 'KITCHEN' },
      { icon: 'inventory_2', label: 'Inventario', value: 'INVENTORY' },
    ];

    if (userRole === 'admin') {
      menuItems.push({ icon: 'history', label: 'Historial', value: 'HISTORY' });
    }
  }

  return (
    <aside className="flex h-full w-20 lg:w-64 flex-col border-r border-white/5 bg-surface-darker p-4 transition-all duration-300">
      
      <div className="flex flex-col gap-8 flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center gap-3 px-2 shrink-0">
           <span className="material-symbols-outlined text-primary text-3xl">school</span>
           <h2 className="text-white text-xl font-bold hidden lg:block">Restaurante Upiicsa</h2>
        </div>

        {user && (
          <div className="hidden lg:flex flex-col gap-2 rounded-lg bg-white/5 p-3 border border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-white text-sm font-semibold truncate">{user.name}</p>
                <p className="text-secondary text-xs truncate">{user.email}</p>
              </div>
            </div>
            <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md text-center font-medium border border-primary/20">
              {user.role === 'admin' ? '👑 Administrador' : user.role === 'cook' ? '👨‍🍳 Cocinero' : '💼 Cajero'}
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onChangeView(item.value as ViewState)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition-colors shrink-0 ${
                currentView === item.value 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-secondary hover:bg-white/5 hover:text-white'
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

      <div className="flex flex-col gap-1 shrink-0 pt-4 border-t border-white/5 mt-2">
        <button
            type="button"
            onClick={() => onChangeView('SETTINGS')}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                currentView === 'SETTINGS' ? 'bg-white/10 text-white' : 'text-secondary hover:bg-white/5 hover:text-white'
            }`}
        >
            <span className="material-symbols-outlined text-2xl">settings</span>
            <p className="text-sm font-medium hidden lg:block">Ajustes</p>
        </button>
        
        {/* BOTÓN DE AYUDA ELIMINADO AQUÍ */}

        <button 
            type="button"
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-red-500/10 transition-colors mt-2"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <p className="text-sm font-medium hidden lg:block">Salir</p>
        </button>
      </div>
    </aside>
  );
};