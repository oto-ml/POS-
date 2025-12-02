import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLogin: (userProfile: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // --- FUNCIÓN TEMPORAL PARA CREAR CUENTAS INICIALES ---
  const seedUsers = async () => {
    const confirmacion = confirm("Esto creará dos usuarios: 'admin@pos.com' y 'cajero@pos.com'. ¿Continuar?");
    if (!confirmacion) return;

    setIsLoading(true);
    try {
      try {
        const adminCred = await createUserWithEmailAndPassword(auth, "admin@pos.com", "123456");
        await setDoc(doc(db, "users", adminCred.user.uid), {
          uid: adminCred.user.uid,
          name: "Gerente General",
          email: "admin@pos.com",
          role: "admin"
        });
        console.log("Admin creado");
      } catch (e) { console.log("El admin ya existía o falló"); }

      try {
        const cashierCred = await createUserWithEmailAndPassword(auth, "cajero@pos.com", "123456");
        await setDoc(doc(db, "users", cashierCred.user.uid), {
          uid: cashierCred.user.uid,
          name: "Cajero Turno 1",
          email: "cajero@pos.com",
          role: "cashier"
        });
        console.log("Cajero creado");
      } catch (e) { console.log("El cajero ya existía o falló"); }

      alert("Usuarios creados:\nAdmin: admin@pos.com / 123456\nCajero: cajero@pos.com / 123456");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    setIsLoading(true);

    try {
      if (!resetEmail) {
        setResetError('Ingresa tu correo electrónico');
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(`✅ Se envió un correo a ${resetEmail}.`);
      setResetEmail('');
      setTimeout(() => {
        setResetMessage('');
        setShowResetForm(false);
      }, 8000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') setResetError('No hay cuenta asociada.');
      else if (err.code === 'auth/invalid-email') setResetError('Correo no válido.');
      else setResetError('Error al enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
        {/* Fondo con patrón azul sutil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4169E1 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="w-full max-w-md bg-surface-dark border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center mb-8">
                <div className="size-16 text-primary mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl">restaurant</span>
                </div>
                <h1 className="text-white text-3xl font-black tracking-tight">
                  {showResetForm ? 'Recuperar Contraseña' : 'Acceso POS'}
                </h1>
                <p className="text-secondary mt-2">
                  {showResetForm ? 'Ingresa tu correo' : 'Bienvenido a Restaurante Upiicsa'}
                </p>
            </div>

            {!showResetForm ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Correo</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-background-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:outline-none placeholder-gray-500"
                        placeholder="usuario@restaurante.com"
                    />
                </div>

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Contraseña</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-background-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:outline-none placeholder-gray-500"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-hover transition-all disabled:opacity-70 shadow-lg shadow-primary/20"
                >
                    {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                </button>

                <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="w-full text-primary hover:text-white text-sm font-bold py-2 transition-colors"
                >
                    ¿Olvidaste tu contraseña?
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {resetMessage && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
                        <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
                        <p>{resetMessage}</p>
                    </div>
                )}

                {resetError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {resetError}
                    </div>
                )}

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Correo Electrónico</label>
                    <input 
                        type="email" 
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-background-dark border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold text-lg py-4 rounded-xl hover:bg-primary-hover transition-all disabled:opacity-70"
                >
                    {isLoading ? 'Enviando...' : 'Enviar Correo'}
                </button>

                <button
                    type="button"
                    onClick={() => {
                      setShowResetForm(false);
                      setResetMessage('');
                      setResetError('');
                    }}
                    className="w-full text-secondary hover:text-white text-sm font-bold py-2 transition-colors"
                >
                    Volver al Login
                </button>
              </form>
            )}
        </div>
    </div>
  );
};