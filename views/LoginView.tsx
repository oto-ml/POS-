import React, { useState } from 'react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    // Simular petición al servidor
    setTimeout(() => {
      setIsLoading(false);
      // Aquí iría la lógica real de autenticación
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0d1c12] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ 
                 backgroundImage: 'radial-gradient(circle at 2px 2px, #25f46a 1px, transparent 0)',
                 backgroundSize: '40px 40px' 
             }}>
        </div>

        <div className="w-full max-w-md bg-[#183422] border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
            <div className="flex flex-col items-center mb-8">
                <div className="size-16 text-primary mb-4">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z" fill="currentColor"></path>
                    </svg>
                </div>
                <h1 className="text-white text-3xl font-black tracking-tight">Bienvenido</h1>
                <p className="text-secondary mt-2">Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Correo Electrónico</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
                            <span className="material-symbols-outlined">mail</span>
                        </span>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#102216] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all"
                            placeholder="usuario@restaurante.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-white text-sm font-bold mb-2">Contraseña</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
                            <span className="material-symbols-outlined">lock</span>
                        </span>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#102216] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-secondary/50 focus:ring-2 focus:ring-primary focus:outline-none focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded bg-[#102216] border-white/10 text-primary focus:ring-primary"/>
                        <span className="text-secondary">Recordarme</span>
                    </label>
                    <button type="button" className="text-primary hover:underline font-medium">¿Olvidaste tu contraseña?</button>
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-background-dark font-bold text-lg py-4 rounded-xl hover:bg-primary-hover hover:scale-[1.02] transition-all shadow-lg shadow-primary/25 disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Iniciando...
                        </>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </form>

            <div className="mt-8 text-center border-t border-white/5 pt-6">
                <p className="text-secondary text-sm">¿No tienes una cuenta?</p>
                <button type="button" className="text-primary font-bold hover:underline">Contactar al Administrador</button>
            </div>
        </div>
    </div>
  );
};