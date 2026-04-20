import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// TIPADOS ESTRICTOS (Cero "any")
interface AdminLoginData {
  id: string;
  password?: string;
}

interface SupervisorLoginData {
  usuario?: string;
  password?: string;
}

interface EventoLoginData {
  admins?: AdminLoginData[];
  supervisor?: SupervisorLoginData;
}

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
    
    // Limpiamos memorias antiguas por seguridad
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_admin_id');
    sessionStorage.removeItem('visor_externo_tipo');

    // AHORA AMBOS CAMPOS SON ESTRICTAMENTE OBLIGATORIOS
    if (!cod || !pass) {
      return alert('Por favor ingresa tu usuario y contraseña.');
    }

    // 1. VALIDACIÓN DEL SUPER ADMIN (Basado en el archivo .env)
    if (cod === SUPERADMIN_USER && pass === SUPERADMIN_PASSWORD) {
      localStorage.setItem('user_role', 'superadmin');
      navigate('/super-admin');
      return;
    } 

    // 2. BUSCAR EN FIREBASE (Supervisor o Administrador)
    setIsLoading(true);
    try {
      const eventosRef = collection(db, 'eventos');
      const snapshot = await getDocs(eventosRef);
      
      let adminFound = false;
      let supervisorFound = false;
      let eventoIdFound = '';
      let adminIdFound = '';

      snapshot.forEach(doc => {
        const evento = doc.data() as EventoLoginData;
        
        // 2.1 REVISAR SI ES SUPERVISOR
        if (evento.supervisor && evento.supervisor.usuario === cod && evento.supervisor.password === pass) {
          supervisorFound = true;
          eventoIdFound = doc.id;
        }

        // 2.2 REVISAR SI ES ADMINISTRADOR NORMAL
        const admins = evento.admins || [];
        const matchedAdmin = admins.find((a) => a.id === cod && a.password === pass);

        if (matchedAdmin) {
          adminFound = true;
          eventoIdFound = doc.id; 
          adminIdFound = matchedAdmin.id;
        }
      });

      // 3. DECISIÓN DE RUTAS BASADA EN EL ROL ENCONTRADO
      if (supervisorFound) {
        localStorage.setItem('user_role', 'supervisor');
        navigate(`/supervisor/${eventoIdFound}`);
      } else if (adminFound) {
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('current_admin_id', adminIdFound);
        navigate(`/admin/${eventoIdFound}`); 
      } else {
        alert('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert('Hubo un error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Acceso Interno</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User size={14} /> Usuario / ID
              </label>
              <input 
                type="text" placeholder="Ej. admin-A3B9 o supervisor1" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Key size={14} /> Contraseña
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