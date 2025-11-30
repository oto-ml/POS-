import React from 'react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems: { icon: string; label: string; value: ViewState }[] = [
    { icon: 'receipt_long', label: 'Pedidos (POS)', value: 'POS' },
    { icon: 'restaurant_menu', label: 'Cocina (KDS)', value: 'KITCHEN' },
    { icon: 'list_alt', label: 'Ordenes', value: 'ORDERS' },
    { icon: 'history', label: 'Historial', value: 'HISTORY' },
  ];

  const secondaryItems: { icon: string; label: string; value: ViewState }[] = [
    { icon: 'settings', label: 'Ajustes', value: 'SETTINGS' },
    { icon: 'help', label: 'Ayuda', value: 'HELP' },
  ];

  return (
    <aside className="flex h-full w-20 lg:w-64 flex-col justify-between border-r border-[#22492f]/50 bg-surface-darker p-4 transition-all duration-300">
      <div className="flex flex-col gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2">
          <div className="size-8 text-primary shrink-0">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold hidden lg:block">Restaurante POS</h2>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => onChangeView(item.value)}
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

      {/* Footer Actions */}
      <div className="flex flex-col gap-1">
        {secondaryItems.map((item) => (
          <button
            key={item.value}
            onClick={() => onChangeView(item.value)}
            className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
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
        <button 
            onClick={() => onChangeView('LOGIN')}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-red-400 hover:bg-[#22492f]/50 hover:text-red-300 transition-colors mt-2"
        >
          <span className="material-symbols-outlined text-2xl">logout</span>
          <p className="text-sm font-medium hidden lg:block">Cerrar Sesión</p>
        </button>
      </div>
    </aside>
  );
};