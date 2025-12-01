import React, { useState, useEffect } from 'react';
// IMPORTANTE: Rutas relativas para evitar errores de compilación
import { db } from '../firebase'; 
import { UserProfile } from '../types';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users'); // Iniciamos en usuarios para facilitar el acceso
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario para Nuevo Usuario
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'cashier' });

  // --- 1. CARGAR LISTA DE USUARIOS ---
  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList = querySnapshot.docs.map(doc => doc.data() as UserProfile);
      setUsers(usersList);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
        fetchUsers();
    }
  }, [activeTab]);

  // --- 2. CREAR USUARIO (TRUCO DE ADMIN) ---
  // Usamos una app secundaria para crear el usuario. Si usáramos 'auth' directo,
  // Firebase cerraría tu sesión de Admin y loguearía al nuevo cajero automáticamente.
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return alert("Por favor completa todos los campos");

    setLoading(true);
    let secondaryApp: any = null;

    try {
        // A. Inicializamos una app temporal
        const config = getApp().options; 
        secondaryApp = initializeApp(config, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        // B. Creamos el usuario en Authentication
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
        const uid = userCredential.user.uid;

        // C. Guardamos su rol y datos en Firestore (Base de datos)
        const userData: UserProfile = {
            uid: uid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as 'admin' | 'cashier'
        };

        await setDoc(doc(db, "users", uid), userData);

        // D. Cerramos la sesión de la app temporal
        await signOut(secondaryAuth);
        
        alert(`¡Usuario ${newUser.name} creado exitosamente!`);
        setNewUser({ name: '', email: '', password: '', role: 'cashier' }); // Limpiar form
        fetchUsers(); // Recargar lista

    } catch (error: any) {
        console.error("Error creando usuario:", error);
        alert("Error: " + error.message);
    } finally {
        // Limpieza de memoria
        if (secondaryApp) deleteApp(secondaryApp);
        setLoading(false);
    }
  };

  // --- 3. BORRAR USUARIO ---
  const handleDeleteUser = async (uid: string, name: string) => {
      if (!confirm(`¿Estás seguro de eliminar el acceso a ${name}?`)) return;
      
      try {
          // Eliminamos el documento de Firestore. 
          // Aunque el usuario siga en Auth, sin este documento el sistema no lo dejará entrar (ver App.tsx).
          await deleteDoc(doc(db, "users", uid));
          alert("Usuario eliminado correctamente.");
          fetchUsers();
      } catch (error) {
          console.error(error);
          alert("Error al eliminar.");
      }
  };

  const tabs = [
    { id: 'users', label: 'Gestión de Usuarios', icon: 'group' },
    { id: 'general', label: 'General', icon: 'tune' },
    { id: 'restaurant', label: 'Restaurante', icon: 'store' },
  ];

  return (
    <main className="flex-1 bg-background-dark overflow-hidden flex flex-col relative h-full">
      <header className="flex items-center justify-between border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
                <h1 className="text-white text-3xl font-black">Panel de Administración</h1>
                <p className="text-secondary text-sm">Control de acceso y configuración</p>
            </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Ajustes */}
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

        {/* Área de Contenido */}
        <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-5xl mx-auto">
                
                {/* --- PESTAÑA: USUARIOS --- */}
                {activeTab === 'users' && (
                    <div className="space-y-8 animate-fade-in">
                        
                        {/* 1. Formulario de Creación */}
                        <div className="bg-[#183422] rounded-xl border border-white/10 p-6 shadow-lg">
                            <h3 className="text-white text-lg font-bold mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                Registrar Nuevo Empleado
                            </h3>
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Nombre Completo</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Ej. Juan Pérez"
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="usuario@restaurante.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Contraseña Temporal</label>
                                    <input 
                                        type="password" 
                                        required
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="******"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Rol / Permisos</label>
                                    <select 
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none cursor-pointer"
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="cashier">Cajero (Solo Ventas y Cocina)</option>
                                        <option value="admin">Administrador (Acceso Total)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex justify-end mt-2">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="bg-primary text-background-dark font-bold px-8 py-3 rounded-lg hover:bg-primary-hover hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">refresh</span>
                                                Creando cuenta...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">save</span>
                                                Crear Usuario
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* 2. Lista de Usuarios */}
                        <div>
                            <h3 className="text-white text-lg font-bold mb-4 ml-1">Usuarios Activos</h3>
                            <div className="bg-[#183422] rounded-xl border border-white/10 overflow-hidden shadow-lg">
                                <table className="w-full text-left">
                                    <thead className="bg-[#102316] text-secondary text-xs uppercase font-bold border-b border-white/5">
                                        <tr>
                                            <th className="p-4 pl-6">Nombre</th>
                                            <th className="p-4">Correo</th>
                                            <th className="p-4">Rol</th>
                                            <th className="p-4 text-right pr-6">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(user => (
                                            <tr key={user.uid} className="hover:bg-white/5 transition-colors group">
                                                <td className="p-4 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                            user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-white font-medium">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-400 text-sm">{user.email}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                                        user.role === 'admin' 
                                                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                        {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right pr-6">
                                                    <button 
                                                        onClick={() => handleDeleteUser(user.uid, user.name)}
                                                        className="text-gray-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="Revocar acceso"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {users.length === 0 && (
                                    <div className="p-12 text-center text-secondary flex flex-col items-center">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">group_off</span>
                                        <p>No se encontraron usuarios registrados.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- OTRAS PESTAÑAS (Solo placeholders visuales) --- */}
                {activeTab === 'general' && (
                    <div className="text-center py-20 animate-fade-in">
                        <span className="material-symbols-outlined text-6xl text-secondary opacity-20 mb-4">tune</span>
                        <h2 className="text-white text-xl font-bold">Configuración General</h2>
                        <p className="text-secondary">Opciones de idioma, moneda y tema.</p>
                    </div>
                )}

                 {activeTab === 'restaurant' && (
                    <div className="text-center py-20 animate-fade-in">
                        <span className="material-symbols-outlined text-6xl text-secondary opacity-20 mb-4">store</span>
                        <h2 className="text-white text-xl font-bold">Datos del Restaurante</h2>
                        <p className="text-secondary">Nombre, dirección y tickets.</p>
                    </div>
                )}

            </div>
        </div>
      </div>
    </main>
  );
};