import React, { useState } from 'react';

const HELP_TOPICS = [
    { title: 'Primeros Pasos', icon: 'flag', desc: 'Configuración inicial y conceptos básicos.', category: 'Basics' },
    { title: 'Gestión de Pedidos', icon: 'receipt_long', desc: 'Cómo crear, modificar y cobrar pedidos.', category: 'Sales' },
    { title: 'Hardware e Impresoras', icon: 'print', desc: 'Solución de problemas de conexión.', category: 'Tech' },
    { title: 'Reportes y Finanzas', icon: 'bar_chart', desc: 'Entendiendo tus métricas de ventas.', category: 'Analytics' },
    { title: 'Usuarios y Permisos', icon: 'group', desc: 'Administrar roles de empleados.', category: 'Admin' },
    { title: 'Facturación Electrónica', icon: 'receipt', desc: 'Generación y envío de facturas.', category: 'Billing' },
];

export const HelpView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTopics = HELP_TOPICS.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContact = (method: string) => {
      alert(`Abriendo sistema de ${method}...`);
  };

  return (
    <main className="flex-1 bg-background-dark overflow-y-auto p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
            <h1 className="text-white text-4xl font-black mb-4">¿Cómo podemos ayudarte?</h1>
            <div className="max-w-xl mx-auto relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-secondary">
                    <span className="material-symbols-outlined">search</span>
                </span>
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar temas de ayuda, tutoriales, etc." 
                    className="w-full bg-[#183422] border border-white/10 rounded-full py-4 pl-12 pr-6 text-white placeholder-secondary focus:ring-2 focus:ring-primary focus:outline-none shadow-lg"
                />
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {filteredTopics.length > 0 ? (
                filteredTopics.map((topic, i) => (
                    <div 
                        key={i} 
                        onClick={() => alert(`Navegando a detalles de: ${topic.title}`)}
                        className="bg-[#183422] border border-white/10 rounded-xl p-6 hover:bg-[#22492f] transition-colors cursor-pointer group animate-fade-in"
                    >
                        <div className="size-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-2xl">{topic.icon}</span>
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">{topic.title}</h3>
                        <p className="text-secondary">{topic.desc}</p>
                    </div>
                ))
            ) : (
                <div className="col-span-full text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-secondary opacity-50 mb-4">search_off</span>
                    <p className="text-white text-lg font-medium">No encontramos resultados para "{searchTerm}"</p>
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="text-primary hover:underline mt-2"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            )}
        </div>

        <div className="bg-primary/10 rounded-2xl p-8 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-white text-2xl font-bold mb-2">¿Aún necesitas ayuda?</h3>
                <p className="text-secondary">Nuestro equipo de soporte está disponible 24/7 para ayudarte con cualquier problema.</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => handleContact('chat en vivo')}
                    className="bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:bg-primary-hover transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">chat</span>
                    Chat en Vivo
                </button>
                <button 
                    onClick={() => handleContact('correo electrónico')}
                    className="bg-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">mail</span>
                    Enviar Correo
                </button>
            </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-secondary text-sm">Versión del Sistema: v2.4.1 (Build 20240715)</p>
            <div className="flex justify-center gap-6 mt-4">
                <button className="text-primary hover:underline text-sm">Términos de Servicio</button>
                <button className="text-primary hover:underline text-sm">Política de Privacidad</button>
            </div>
        </div>
      </div>
    </main>
  );
};