import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLogin: (userProfile: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- FUNCIÓN TEMPORAL PARA CREAR CUENTAS INICIALES ---
  const seedUsers = async () => {
    const confirmacion = confirm("Esto creará dos usuarios: 'admin@pos.com' y 'cajero@pos.com'. ¿Continuar?");
    if (!confirmacion) return;

    setIsLoading(true);
    try {
      // 1. Crear Admin
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

      // 2. Crear Cajero
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
  // -----------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Intentamos iniciar sesión con Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      // El observador en App.tsx manejará la redirección y carga de perfil
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas. Intenta de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0d1c12] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #25f46a 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="w-full max-w-md bg-[#183422] border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center mb-8">
                <div className="size-16 text-primary mb-4">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                    </svg>
                </div>
                <h1 className="text-white text-3xl font-black tracking-tight">Acceso POS</h1>
                <p className="text-secondary mt-2">Ingresa tus credenciales</p>
            </div>

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
                        className="w-full bg-[#102216] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="usuario@restaurante.com"
                    />
                </div>

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Contraseña</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#102216] border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                        placeholder="••••••••"
                    />
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-xl hover:bg-primary-hover transition-all disabled:opacity-70"
                >
                    {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                </button>
            </form>

            <div className="mt-6 border-t border-white/10 pt-4 text-center">
                 <button onClick={seedUsers} className="text-xs text-secondary hover:text-white underline">
                    🛠️ Crear usuarios de prueba (Solo 1ra vez)
                 </button>
            </div>
        </div>
    </div>
  );
};