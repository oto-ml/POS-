import React, { useState, useEffect } from 'react';
// IMPORTACIONES CORREGIDAS (Rutas relativas)
import { db, auth } from '../firebase'; 
import { UserProfile, UserRole } from '../types';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { isUserLocked, recordFailedAttempt, clearAttempts, getAttemptInfo } from '../utils/rateLimiter';

interface SettingsViewProps {
  userRole?: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ userRole }) => {
  const [activeTab, setActiveTab] = useState('my-account'); // Iniciamos en Mi Cuenta por defecto
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // Formulario Nuevo Usuario (Admin)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'cashier' });

  // Formulario Cambio de Contraseña (Usuario Actual)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // --- CARGAR USUARIOS ---
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

  // --- VALIDAR FORTALEZA DE CONTRASEÑA ---
  const validatePasswordStrength = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Mínimo 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Debe incluir mayúsculas' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Debe incluir minúsculas' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Debe incluir números' };
    }
    if (!/[!@#$%^&*]/.test(password)) {
      return { valid: false, message: 'Debe incluir caracteres especiales (!@#$%^&*)' };
    }
    return { valid: true, message: 'Contraseña segura' };
  };

  // --- CAMBIAR CONTRASEÑA (Usuario Actual) CON SEGURIDAD MEJORADA ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const user = auth.currentUser;
    if (!user || !user.email) {
      setPasswordError('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      return;
    }

    // Verificar si el usuario está bloqueado por intentos fallidos
    if (isUserLocked(user.uid)) {
      const info = getAttemptInfo(user.uid);
      setPasswordError(`Demasiados intentos fallidos. Intenta de nuevo en ${info?.unlockTimeMinutes} minutos.`);
      return;
    }

    // Validaciones
    if (!passwordForm.currentPassword) {
      setPasswordError('Debes ingresar tu contraseña actual para cambiarla.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    // Validar fortaleza
    const strengthCheck = validatePasswordStrength(passwordForm.newPassword);
    if (!strengthCheck.valid) {
      setPasswordError(strengthCheck.message);
      return;
    }

    setPasswordLoading(true);
    try {
      // 1. RE-AUTENTICAR AL USUARIO (Seguridad: verifica que sea realmente él)
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Si llegó aquí, la contraseña actual es correcta - limpiar intentos fallidos
      clearAttempts(user.uid);

      // 3. ACTUALIZAR LA CONTRASEÑA
      await updatePassword(user, passwordForm.newPassword);

      // 4. REGISTRAR EN AUDITORÍA
      try {
        await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'PASSWORD_CHANGED',
          timestamp: serverTimestamp(),
          userEmail: user.email,
          details: 'Usuario cambió su contraseña de forma segura',
          ipAddress: 'N/A', // En producción, obtener IP real del servidor
          success: true
        });
      } catch (auditError) {
        console.warn('No se pudo registrar en auditoría:', auditError);
        // No bloqueamos si la auditoría falla, pero lo notamos
      }

      setPasswordSuccess('¡Contraseña actualizada correctamente! Tu nueva contraseña está activa.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => setPasswordSuccess(''), 5000);

    } catch (error: any) {
      console.error('Error al actualizar contraseña:', error);

      // Registrar intento fallido en auditoría
      try {
        await addDoc(collection(db, 'audit_logs'), {
          userId: user.uid,
          action: 'PASSWORD_CHANGE_FAILED',
          timestamp: serverTimestamp(),
          userEmail: user.email,
          errorCode: error.code,
          details: 'Intento fallido de cambio de contraseña',
          success: false
        });
      } catch (auditError) {
        console.warn('No se pudo registrar fallo en auditoría:', auditError);
      }

      // Registrar intento fallido para rate limiting
      const shouldLock = recordFailedAttempt(user.uid);
      if (shouldLock) {
        const info = getAttemptInfo(user.uid);
        setPasswordError(`Demasiados intentos fallidos. Bloqueado por ${info?.unlockTimeMinutes} minutos.`);
        return;
      }

      // Manejo específico de errores
      if (error.code === 'auth/wrong-password') {
        const info = getAttemptInfo(user.uid);
        const attempts = info?.attempts || 0;
        setPasswordError(`La contraseña actual es incorrecta. Intento ${attempts}/${5}. Tienes ${5 - attempts} intentos restantes.`);
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Por seguridad, debes cerrar sesión e iniciar nuevamente antes de cambiar tu contraseña.');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('La contraseña es demasiado débil según los estándares de Firebase.');
      } else {
        setPasswordError('Error al actualizar: ' + (error.message || 'Intenta nuevamente'));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- CREAR USUARIO (Sin cerrar sesión actual) ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) return alert("Completa todos los campos");

    setLoading(true);
    let secondaryApp: any = null;

    try {
        const config = getApp().options; 
        secondaryApp = initializeApp(config, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
        const uid = userCredential.user.uid;

        const userData: UserProfile = {
            uid: uid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role as 'admin' | 'cashier' | 'cook'
        };

        await setDoc(doc(db, "users", uid), userData);
        await signOut(secondaryAuth);
        
        alert(`Usuario ${newUser.name} creado correctamente.`);
        setNewUser({ name: '', email: '', password: '', role: 'cashier' }); 
        fetchUsers(); 

    } catch (error: any) {
        console.error("Error creando usuario:", error);
        alert("Error: " + error.message);
    } finally {
        if (secondaryApp) deleteApp(secondaryApp);
        setLoading(false);
    }
  };

  // --- BORRAR USUARIO ---
  const handleDeleteUser = async (uid: string, name: string) => {
      if (!confirm(`¿Seguro que quieres eliminar el acceso de ${name}?`)) return;
      
      try {
          await deleteDoc(doc(db, "users", uid));
          alert("Acceso revocado correctamente.");
          fetchUsers();
      } catch (error) {
          console.error(error);
          alert("Error al eliminar.");
      }
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
      <header className="flex items-center justify-between border-b border-white/10 p-6">
        <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined">settings</span>
            </div>
            <h1 className="text-white text-3xl font-black">Configuración</h1>
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
            <div className="max-w-4xl mx-auto">
                
                {/* --- PESTAÑA: MI CUENTA (Cambio de Contraseña) --- */}
                {activeTab === 'my-account' && (
                    <div className="space-y-8 animate-fade-in">
                        <div>
                            <h2 className="text-white text-xl font-bold">Mi Cuenta</h2>
                            <p className="text-secondary text-sm">Gestiona tu seguridad y acceso.</p>
                        </div>

                        <div className="bg-[#183422] rounded-xl border border-white/10 p-6 max-w-md">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">lock_reset</span>
                                Cambiar Contraseña
                            </h3>

                            {/* Mensajes de Error o Éxito */}
                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                                    <p className="text-red-300 text-sm font-medium">{passwordError}</p>
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
                                    <p className="text-green-300 text-sm font-medium">{passwordSuccess}</p>
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Contraseña Actual</label>
                                    <input 
                                        type="password" 
                                        required
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors"
                                        placeholder="Ingresa tu contraseña actual"
                                        value={passwordForm.currentPassword}
                                        onChange={e => {
                                            setPasswordForm({...passwordForm, currentPassword: e.target.value});
                                            setPasswordError('');
                                        }}
                                    />
                                    <p className="text-xs text-secondary mt-1">Requerido para verificar tu identidad</p>
                                </div>

                                <div className="border-t border-white/10 pt-4">
                                    <div>
                                        <label className="block text-secondary text-xs font-bold uppercase mb-2">Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            required
                                            className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors"
                                            placeholder="Mínimo 8 caracteres con requisitos de seguridad"
                                            value={passwordForm.newPassword}
                                            onChange={e => {
                                                setPasswordForm({...passwordForm, newPassword: e.target.value});
                                                setPasswordError('');
                                            }}
                                        />
                                        
                                        {/* Indicador de Fortaleza */}
                                        {passwordForm.newPassword && (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${passwordForm.newPassword.length >= 8 ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                                                    <span className={passwordForm.newPassword.length >= 8 ? 'text-green-400' : 'text-gray-500'}>Mínimo 8 caracteres</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordForm.newPassword) ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                                                    <span className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}>Mayúsculas (A-Z)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${/[a-z]/.test(passwordForm.newPassword) ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                                                    <span className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}>Minúsculas (a-z)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordForm.newPassword) ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                                                    <span className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}>Números (0-9)</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${/[!@#$%^&*]/.test(passwordForm.newPassword) ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                                                    <span className={/[!@#$%^&*]/.test(passwordForm.newPassword) ? 'text-green-400' : 'text-gray-500'}>Caracteres especiales (!@#$%^&*)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-secondary text-xs font-bold uppercase mb-2">Confirmar Contraseña</label>
                                    <input 
                                        type="password" 
                                        required
                                        className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none transition-colors"
                                        placeholder="Repite la nueva contraseña"
                                        value={passwordForm.confirmPassword}
                                        onChange={e => {
                                            setPasswordForm({...passwordForm, confirmPassword: e.target.value});
                                            setPasswordError('');
                                        }}
                                    />
                                    {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                        <p className="text-xs text-red-400 mt-1">Las contraseñas no coinciden</p>
                                    )}
                                    {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                                        <p className="text-xs text-green-400 mt-1">✓ Las contraseñas coinciden</p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={passwordLoading}
                                        className="w-full bg-primary text-background-dark font-bold px-6 py-3 rounded-lg hover:bg-primary-hover flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {passwordLoading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                                Actualizando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-sm">lock</span>
                                                Cambiar Contraseña
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <p className="text-blue-300 text-xs">
                                        <strong>💡 Consejo de Seguridad:</strong> Cambia tu contraseña regularmente y usa una única contraseña fuerte que solo tú conozcas.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* --- VISTA DE USUARIOS (Solo Admin debería ver esto en sidebar, pero lo mantenemos funcional) --- */}
                {activeTab === 'users' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-white text-xl font-bold">Gestión de Usuarios</h2>
                                <p className="text-secondary text-sm">Administra quién tiene acceso al sistema.</p>
                            </div>
                        </div>

                        {/* Formulario de Creación */}
                        <div className="bg-[#183422] rounded-xl border border-white/10 p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person_add</span>
                                Nuevo Usuario
                            </h3>
                            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-secondary text-xs font-bold uppercase">Nombre</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full bg-[#22492f] text-white rounded p-2 mt-1 border border-white/10 focus:border-primary outline-none"
                                        placeholder="Ej. Juan Pérez"
                                        value={newUser.name}
                                        onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-secondary text-xs font-bold uppercase">Correo</label>
                                    <input 
                                        type="email" 
                                        required
                                        className="w-full bg-[#22492f] text-white rounded p-2 mt-1 border border-white/10 focus:border-primary outline-none"
                                        placeholder="usuario@pos.com"
                                        value={newUser.email}
                                        onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-secondary text-xs font-bold uppercase">Contraseña</label>
                                    <input 
                                        type="password" 
                                        required
                                        className="w-full bg-[#22492f] text-white rounded p-2 mt-1 border border-white/10 focus:border-primary outline-none"
                                        placeholder="******"
                                        value={newUser.password}
                                        onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-secondary text-xs font-bold uppercase">Rol</label>
                                    <select 
                                        className="w-full bg-[#22492f] text-white rounded p-2 mt-1 border border-white/10 outline-none"
                                        value={newUser.role}
                                        onChange={e => setNewUser({...newUser, role: e.target.value})}
                                    >
                                        <option value="cashier">Cajero (Ventas)</option>
                                        <option value="cook">Cocinero (Cocina)</option>
                                        <option value="admin">Administrador (Total)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2 pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:bg-primary-hover w-full md:w-auto flex items-center justify-center gap-2"
                                    >
                                        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                        {loading ? 'Creando...' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Tabla de Usuarios */}
                        <div className="bg-[#183422] rounded-xl border border-white/10 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-[#22492f] text-secondary text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Nombre</th>
                                        <th className="p-4">Correo</th>
                                        <th className="p-4">Rol</th>
                                        <th className="p-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {users.map(user => (
                                        <tr key={user.uid} className="hover:bg-white/5">
                                            <td className="p-4 text-white font-medium">{user.name}</td>
                                            <td className="p-4 text-gray-300">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                    user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : user.role === 'cook' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {user.role === 'admin' ? 'Administrador' : user.role === 'cook' ? 'Cocinero' : 'Cajero'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteUser(user.uid, user.name)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                                                    title="Eliminar acceso"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {users.length === 0 && (
                                <div className="p-8 text-center text-secondary">
                                    No hay usuarios registrados.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                 {/* --- VISTA RESTAURANTE (Placeholder) --- */}
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