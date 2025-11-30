import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Form States
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('Español (México)');
  const [currency, setCurrency] = useState('MXN ($)');
  const [restaurantInfo, setRestaurantInfo] = useState({
      name: "Restaurante POS",
      phone: "+52 55 1234 5678",
      address: "Av. Reforma 222, CDMX",
      rfc: "XAXX010101000"
  });

  const tabs = [
    { id: 'general', label: 'General', icon: 'tune' },
    { id: 'restaurant', label: 'Restaurante', icon: 'store' },
    { id: 'users', label: 'Usuarios', icon: 'group' },
    { id: 'printers', label: 'Impresoras', icon: 'print' },
    { id: 'billing', label: 'Facturación', icon: 'receipt' },
  ];

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => {
          setIsSaving(false);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
      }, 1000);
  };

  const handleInfoChange = (field: string, value: string) => {
      setRestaurantInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <main className="flex-1 bg-background-dark overflow-hidden flex flex-col relative">
      {/* Toast Notification */}
      {showToast && (
          <div className="absolute top-6 right-6 bg-primary text-background-dark px-6 py-4 rounded-xl shadow-xl z-50 flex items-center gap-3 animate-bounce-in">
              <span className="material-symbols-outlined">check_circle</span>
              <span className="font-bold">Configuración guardada correctamente</span>
          </div>
      )}

      <header className="flex items-center justify-between border-b border-white/10 p-6 lg:p-8">
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">settings</span>
            </div>
            <h1 className="text-white text-3xl font-black">Configuración</h1>
        </div>
        <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-70"
        >
            {isSaving ? (
                <>
                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                    Guardando...
                </>
            ) : (
                'Guardar Cambios'
            )}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-[#102316] overflow-y-auto hidden md:block">
            <nav className="p-4 space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.id 
                            ? 'bg-primary/20 text-primary' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <span className="material-symbols-outlined">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl">
                {activeTab === 'general' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-white text-xl font-bold mb-4">Preferencias Generales</h2>
                            <div className="bg-[#183422] rounded-xl border border-white/10 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Modo Oscuro</p>
                                        <p className="text-secondary text-sm">Usar tema oscuro en la interfaz</p>
                                    </div>
                                    <button 
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <div className="border-t border-white/10 pt-6">
                                    <label className="block text-white font-medium mb-2">Idioma</label>
                                    <select 
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full bg-[#22492f] border-none text-white rounded-lg p-2.5"
                                    >
                                        <option>Español (México)</option>
                                        <option>English (US)</option>
                                        <option>Français</option>
                                    </select>
                                </div>
                                <div className="border-t border-white/10 pt-6">
                                    <label className="block text-white font-medium mb-2">Moneda</label>
                                    <select 
                                        value={currency}
                                        onChange={(e) => setCurrency(e.target.value)}
                                        className="w-full bg-[#22492f] border-none text-white rounded-lg p-2.5"
                                    >
                                        <option>MXN ($)</option>
                                        <option>USD ($)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'restaurant' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-white text-xl font-bold mb-4">Información del Restaurante</h2>
                            <div className="bg-[#183422] rounded-xl border border-white/10 p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-secondary text-sm font-bold mb-2">Nombre del Establecimiento</label>
                                        <input 
                                            type="text" 
                                            value={restaurantInfo.name}
                                            onChange={(e) => handleInfoChange('name', e.target.value)}
                                            className="w-full bg-[#22492f] border-none text-white rounded-lg p-3 placeholder-secondary/50 focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-secondary text-sm font-bold mb-2">Teléfono</label>
                                        <input 
                                            type="text" 
                                            value={restaurantInfo.phone}
                                            onChange={(e) => handleInfoChange('phone', e.target.value)}
                                            className="w-full bg-[#22492f] border-none text-white rounded-lg p-3 placeholder-secondary/50 focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-secondary text-sm font-bold mb-2">Dirección</label>
                                        <input 
                                            type="text" 
                                            value={restaurantInfo.address}
                                            onChange={(e) => handleInfoChange('address', e.target.value)}
                                            className="w-full bg-[#22492f] border-none text-white rounded-lg p-3 placeholder-secondary/50 focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-secondary text-sm font-bold mb-2">RFC / Tax ID</label>
                                        <input 
                                            type="text" 
                                            value={restaurantInfo.rfc}
                                            onChange={(e) => handleInfoChange('rfc', e.target.value)}
                                            className="w-full bg-[#22492f] border-none text-white rounded-lg p-3 placeholder-secondary/50 focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'printers' && (
                    <div className="space-y-8 animate-fade-in">
                         <div className="flex justify-between items-center">
                            <h2 className="text-white text-xl font-bold">Impresoras Conectadas</h2>
                            <button 
                                onClick={() => alert('Abrir modal de búsqueda de impresoras...')}
                                className="text-primary font-bold text-sm hover:underline"
                            >
                                + Agregar Impresora
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-[#183422] rounded-xl border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-[#22492f] flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">print</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Caja Principal</p>
                                        <p className="text-secondary text-sm">EPSON TM-T88V • 192.168.1.20</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-bold uppercase">En Línea</span>
                                    <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"><span className="material-symbols-outlined">more_vert</span></button>
                                </div>
                            </div>
                            <div className="bg-[#183422] rounded-xl border border-white/10 p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-[#22492f] flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">restaurant</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Cocina - Caliente</p>
                                        <p className="text-secondary text-sm">Star Micronics SP700 • 192.168.1.21</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-bold uppercase">En Línea</span>
                                    <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"><span className="material-symbols-outlined">more_vert</span></button>
                                </div>
                            </div>
                            <div className="bg-[#183422] rounded-xl border border-white/10 p-4 flex items-center justify-between opacity-75 group hover:opacity-100 hover:border-white/20 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-lg bg-[#22492f] flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined">local_bar</span>
                                    </div>
                                    <div>
                                        <p className="text-white font-bold">Barra</p>
                                        <p className="text-secondary text-sm">EPSON TM-m30 • 192.168.1.22</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-bold uppercase">Error de Papel</span>
                                    <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"><span className="material-symbols-outlined">more_vert</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </main>
  );
};