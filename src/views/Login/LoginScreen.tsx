import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, User, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../components/ToastProvider';

// TIPADOS ESTRICTOS
interface AdminLoginData {
  id: string;
  password?: string;
}

interface SupervisorLoginData {
  usuario?: string;
  password?: string;
}

// 1. Añadimos la interfaz para el Capitán (CORRECCIÓN APLICADA AQUÍ)
interface CapitanLoginData {
  id: string;
  usuario?: string; // Ahora TypeScript sabe que los capitanes tienen un nombre de usuario corto
  password?: string;
}

interface EventoLoginData {
  admins?: AdminLoginData[];
  supervisor?: SupervisorLoginData;
  capitanesPorAdmin?: Record<string, CapitanLoginData[]>;
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
    localStorage.removeItem('current_capitan_id'); // Limpiamos rastro de capitán
    sessionStorage.removeItem('visor_externo_tipo');

    if (!cod || !pass) {
      showToast('Por favor ingresa tu usuario y contraseña.', 'error');
      return;
    }

    // 1. VALIDACIÓN DEL SUPER ADMIN
    if (cod === SUPERADMIN_USER && pass === SUPERADMIN_PASSWORD) {
      localStorage.setItem('user_role', 'superadmin');
      navigate('/super-admin');
      return;
    } 

    // 2. BUSCAR EN FIREBASE (Supervisor, Administrador o Capitán)
    setIsLoading(true);
    try {
      const eventosRef = collection(db, 'eventos');
      const snapshot = await getDocs(eventosRef);
      
      let adminFound = false;
      let supervisorFound = false;
      let capitanFound = false;
      
      let eventoIdFound = '';
      let adminIdFound = '';
      let capitanIdFound = '';

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

        // 2.3 REVISAR SI ES CAPITÁN (CORRECCIÓN APLICADA AQUÍ)
        const capitanesDict = evento.capitanesPorAdmin || {};
        // Recorremos las listas de capitanes de todos los admins del evento
        for (const adminIdPadre in capitanesDict) {
          const listaCapitanes = capitanesDict[adminIdPadre] || [];
          
          // Cambiamos c.id por c.usuario, ya que el Capitán ingresa su usuario corto (ej. cap-ABCD)
          const matchedCapitan = listaCapitanes.find((c) => c.usuario === cod && c.password === pass);
          
          if (matchedCapitan) {
            capitanFound = true;
            eventoIdFound = doc.id;
            capitanIdFound = matchedCapitan.id; // Guardamos su ID interno para las consultas
            adminIdFound = adminIdPadre; // Necesitamos saber de qué admin es este capitán
          }
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
      } else if (capitanFound) {
        // Redirección para el Capitán
        localStorage.setItem('user_role', 'capitan');
        localStorage.setItem('current_admin_id', adminIdFound); // Carga la estructura del evento de su jefe
        localStorage.setItem('current_capitan_id', capitanIdFound); // Guarda su ID para abrir su cajón de invitados
        navigate(`/admin/${eventoIdFound}`); 
      } else {
        showToast('Credenciales incorrectas. Verifica tu usuario y contraseña.', 'error');
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      showToast('Hubo un error al conectar con el servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const { showToast } = useToast();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="bg-blue-50 p-8 text-center flex flex-col items-center border-b border-blue-100">
          <img 
            src="/logo-gestor-de-turnos.png" 
            alt="Logo Gestor de Turnos" 
            className="w-24 h-24 object-cover mb-4 rounded-3xl shadow-md border border-blue-200 bg-white" 
          />
          <h1 className="text-2xl font-black text-blue-950 tracking-tighter uppercase">Gestor de Turnos</h1>
          <p className="text-blue-600/80 text-xs font-bold tracking-widest uppercase mt-1">Acceso Interno</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User size={14} /> Usuario / ID
              </label>
              <input 
                type="text" placeholder="Ej. admin-A3B9 o supervisor1" value={codigo} onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm text-slate-700 transition" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Key size={14} /> Contraseña
              </label>
              <div className="relative">
                <input 
                  type={mostrarPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm text-slate-700 transition" 
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