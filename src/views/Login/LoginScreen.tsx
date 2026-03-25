import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); 
  const [isLoading, setIsLoading] = useState(false);

  const SUPERADMIN_USER = import.meta.env.VITE_SUPERADMIN_USER;
  const SUPERADMIN_PASSWORD = import.meta.env.VITE_SUPERADMIN_PASSWORD;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cod = codigo.trim();
    const pass = password.trim();
    
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');

    if (!cod) return alert('Por favor ingresa un código de acceso o ID.');

    // 1. VALIDACIÓN DEL SUPER ADMIN
    if (cod === SUPERADMIN_USER && pass === SUPERADMIN_PASSWORD) {
      localStorage.setItem('user_role', 'superadmin');
      navigate('/super-admin');
      return;
    } 

    // 2. BUSCAR EN FIREBASE (SI PONE CONTRASEÑA O SU ID EMPIEZA CON ADMIN)
    if (pass !== '' || cod.toLowerCase().startsWith('admin-')) {
      if (pass === '') {
        return alert('Por favor ingresa tu contraseña de Administrador.');
      }

      setIsLoading(true);
      try {
        const eventosRef = collection(db, 'eventos');
        const snapshot = await getDocs(eventosRef);
        
        let adminFound = false;
        let eventoIdFound = '';
        let adminIdFound = '';

        snapshot.forEach(doc => {
          const evento = doc.data();
          const admins = evento.admins || [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const matchedAdmin = admins.find((a: any) => a.id === cod && a.password === pass);

          if (matchedAdmin) {
            adminFound = true;
            eventoIdFound = doc.id; 
            adminIdFound = matchedAdmin.id;
          }
        });

        if (adminFound) {
          localStorage.setItem('user_role', 'admin');
          localStorage.setItem('current_admin_id', adminIdFound);
          navigate(`/admin/${eventoIdFound}`); 
        } else {
          alert('Credenciales incorrectas. Verifica tu ID y contraseña.');
        }
      } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert('Hubo un error al conectar con el servidor.');
      } finally {
        setIsLoading(false);
      }
      return; // Detiene la ejecución para que no pase al código de Participante
    } 
    
    // 3. SI SOLO PONE ID (SIN CONTRASEÑA), ES UN PARTICIPANTE
    navigate(`/turno/${codigo}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 border border-slate-700 shadow-inner mb-4">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Gestor de Turnos</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Acceso al Sistema 3.0</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User size={14} /> Código de Acceso / ID
              </label>
              <input 
                type="text" placeholder="Ej. admin-A3B9 o Gestor1314" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Key size={14} /> Contraseña <span className="text-slate-300 font-medium normal-case">(Opcional para participantes)</span>
              </label>
              <div className="relative">
                <input 
                  type={mostrarPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700" 
                />
                <button type="button" onClick={() => setMostrarPassword(!mostrarPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-500 transition-colors">
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2 mt-4 text-sm uppercase disabled:bg-blue-400"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Entrar al Sistema <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;