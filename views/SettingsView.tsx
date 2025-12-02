import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { UserProfile, UserRole } from '../types';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from 'firebase/auth';
import { isUserLocked, recordFailedAttempt, clearAttempts, getAttemptInfo } from '../utils/rateLimiter';
import { deleteUserFromAuth, getManualDeleteInstructions } from '../utils/deleteUser';

interface SettingsViewProps {
  userRole?: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('my-account');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      setUsers(querySnapshot.docs.map(doc => doc.data() as UserProfile));
    } catch (error) { console.error("Error:", error); }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) return { valid: false, message: 'Mínimo 8 caracteres' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Debe incluir mayúsculas' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Debe incluir minúsculas' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Debe incluir números' };
    if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: 'Debe incluir caracteres especiales (!@#$%^&*)' };
    return { valid: true, message: 'Contraseña segura' };
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const user = auth.currentUser;
    if (!user || !user.email) return setPasswordError('No hay sesión activa.');

    if (isUserLocked(user.uid)) {
      const info = getAttemptInfo(user.uid);
      return setPasswordError(`Bloqueado por ${info?.unlockTimeMinutes} minutos.`);
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordError('Las contraseñas no coinciden.');
    const strengthCheck = validatePasswordStrength(passwordForm.newPassword);
    if (!strengthCheck.valid) return setPasswordError(strengthCheck.message);

    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      clearAttempts(user.uid);
      await updatePassword(user, passwordForm.newPassword);
      
      await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'PASSWORD_CHANGED',
          timestamp: serverTimestamp(),
          userEmail: user.email,
          success: true
      });

      setPasswordSuccess('¡Contraseña actualizada correctamente!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 5000);

    } catch (error: any) {
      console.error(error);
      const shouldLock = recordFailedAttempt(user.uid);
      if (shouldLock) {
          const info = getAttemptInfo(user.uid);
          setPasswordError(`Demasiados intentos. Bloqueado por ${info?.unlockTimeMinutes} min.`);
      } else {
          setPasswordError('Error: ' + (error.code === 'auth/wrong-password' ? 'Contraseña actual incorrecta' : error.message));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let secondaryApp: any = null;

    try {
        const config = getApp().options; 
        secondaryApp = initializeApp(config, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
            uid: userCredential.user.uid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as any
        });

        try { await sendEmailVerification(userCredential.user); } catch (e) {}
        await signOut(secondaryAuth);
        
        alert(`Usuario ${newUser.name} creado.`);
        setNewUser({ name: '', email: '', password: '', role: 'cashier' }); 
        fetchUsers(); 

    } catch (error: any) { alert("Error: " + error.message); } 
    finally { if (secondaryApp) deleteApp(secondaryApp); setLoading(false); }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
      if (!confirm(`¿Eliminar acceso de ${name}?`)) return;
      try {
          const userDoc = users.find(u => u.uid === uid);
          const email = userDoc?.email || '';
          
          await deleteDoc(doc(db, "users", uid));
          
          const authDeleted = await deleteUserFromAuth(uid);
          if (authDeleted) alert("Usuario eliminado completamente.");
          else alert(`Usuario eliminado del sistema.\n\n${getManualDeleteInstructions(email)}`);
          
          fetchUsers();
      } catch (error) { console.error(error); alert("Error al eliminar."); }
  };

  const tabs = [
    { id: 'my-account', label: 'Mi Cuenta', icon: 'account_circle' },
    ...(userRole === 'admin' ? [
      { id: 'users', label: 'Gestión de Usuarios', icon: 'group' },
      { id: 'restaurant', label: 'Restaurante', icon: 'store' },
    ] : []),
  ];

  return (
    <main className="flex-1 bg-background-dark overflow-hidden flex flex-col relative h-full">
      <header className="flex items-center justify-between border-b border-white/5 p-6 bg-background-dark">
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                <span className="material-symbols-outlined">settings</span>
            </div>
            <h1 className="text-white text-3xl font-black">Configuración</h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Ajustes */}
        <aside className="w-64 border-r border-white/5 bg-surface-darker overflow-y-auto hidden md:block">
            <nav className="p-4 space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 translate-x-1' 
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
        <div className="flex-1 overflow-y-auto p-8 bg-background-dark">
            <div className="max-w-4xl mx-auto">
                
                {/* --- PESTAÑA: MI CUENTA --- */}
                {activeTab === 'my-account' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-white text-xl font-bold">Mi Cuenta</h2>
                            <p className="text-secondary text-sm">Gestiona tu seguridad y acceso.</p>
                        </div>

                        <div className="bg-surface-dark rounded-xl border border-white/5 p-6 max-w-md shadow-xl">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2 pb-4 border-b border-white/5">
                                <span className="material-symbols-outlined text-primary">lock_reset</span>
                                Cambiar Contraseña
                            </h3>

                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-sm">
                                    <span className="material-symbols-outlined text-lg">error</span> {passwordError}
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-300 text-sm">
                                    <span className="material-symbols-outlined text-lg">check_circle</span> {passwordSuccess}
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-5">
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Contraseña Actual</label>
                                    <input type="password" required
                                        className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="••••••••"
                                        value={passwordForm.currentPassword}
                                        onChange={e => { setPasswordForm({...passwordForm, currentPassword: e.target.value}); setPasswordError(''); }}
                                    />
                                </div>

                                <div className="border-t border-white/5 pt-2">
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Nueva Contraseña</label>
                                    <input type="password" required
                                        className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Mínimo 8 caracteres"
                                        value={passwordForm.newPassword}
                                        onChange={e => { setPasswordForm({...passwordForm, newPassword: e.target.value}); setPasswordError(''); }}
                                    />
                                </div>

                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Confirmar</label>
                                    <input type="password" required
                                        className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                                        placeholder="Repite la contraseña"
                                        value={passwordForm.confirmPassword}
                                        onChange={e => { setPasswordForm({...passwordForm, confirmPassword: e.target.value}); setPasswordError(''); }}
                                    />
                                </div>

                                <button type="submit" disabled={passwordLoading}
                                    className="w-full bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-hover flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-lg shadow-primary/20 transition-all"
                                >
                                    {passwordLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- VISTA DE USUARIOS --- */}
                {activeTab === 'users' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-white text-xl font-bold">Gestión de Usuarios</h2>
                                <p className="text-secondary text-sm">Administra el acceso del personal.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            {/* Formulario */}
                            <div className="bg-surface-dark rounded-xl border border-white/5 p-6 shadow-xl h-fit">
                                <h3 className="text-white font-bold mb-4 flex items-center gap-2 pb-4 border-b border-white/5">
                                    <span className="material-symbols-outlined text-primary">person_add</span>
                                    Nuevo Usuario
                                </h3>
                                <form onSubmit={handleCreateUser} className="space-y-4">
                                    <div>
                                        <label className="text-secondary text-xs font-bold uppercase mb-1 block">Nombre</label>
                                        <input type="text" required placeholder="Ej. Juan Pérez" className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-secondary text-xs font-bold uppercase mb-1 block">Correo</label>
                                        <input type="email" required placeholder="correo@ejemplo.com" className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-secondary text-xs font-bold uppercase mb-1 block">Contraseña</label>
                                        <input type="password" required placeholder="••••••••" className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-secondary text-xs font-bold uppercase mb-1 block">Rol</label>
                                        <select className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                                            <option value="cashier">Cajero (Ventas)</option>
                                            <option value="cook">Cocinero (Cocina)</option>
                                            <option value="admin">Administrador</option>
                                        </select>
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-hover shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined">add</span>}
                                        Crear Usuario
                                    </button>
                                </form>
                            </div>

                            {/* Tabla */}
                            <div className="xl:col-span-2 bg-surface-dark rounded-xl border border-white/5 overflow-hidden shadow-xl flex flex-col">
                                <div className="p-4 bg-black/20 border-b border-white/5">
                                    <h3 className="font-bold text-white">Usuarios Activos ({users.length})</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-black/20 text-secondary text-xs uppercase font-bold">
                                            <tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4 text-right">Acciones</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {users.map(user => (
                                                <tr key={user.uid} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-white font-bold text-sm">{user.name}</p>
                                                        <p className="text-secondary text-xs">{user.email}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                                            user.role === 'admin' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' : 
                                                            user.role === 'cook' ? 'bg-orange-500/10 text-orange-300 border-orange-500/30' : 
                                                            'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                                        }`}>
                                                            {user.role === 'admin' ? 'Admin' : user.role === 'cook' ? 'Cocina' : 'Caja'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDeleteUser(user.uid, user.name)} className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="Eliminar">
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                 {activeTab === 'restaurant' && (
                    <div className="text-center py-20 animate-fade-in bg-surface-dark rounded-xl border border-white/5 shadow-xl">
                        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-6xl text-primary">store</span>
                        </div>
                        <h2 className="text-white text-xl font-bold">Datos del Restaurante</h2>
                        <p className="text-secondary mt-2">Configuración general próximamente...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </main>
  );
};