import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Key, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); // Estado para el "ojito"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const cod = codigo.toLowerCase().trim();
    const pass = password.trim();
    
    // 1. LEER VARIABLES DE ENTORNO PARA EL SUPER ADMIN
    const superUser = import.meta.env.VITE_SUPERADMIN_USER;
    const superPass = import.meta.env.VITE_SUPERADMIN_PASSWORD;

    // 2. VALIDACIÓN DEL SUPER ADMIN
    if (cod === superUser && pass === superPass) {
      // Si coinciden exactamente con el .env, entra el Jefe de Jefes
      navigate('/super-admin');
    } 
    // 3. LÓGICA TEMPORAL PARA ADMINS Y PARTICIPANTES
    else if (pass !== '') {
      // Si pone contraseña pero no es el SuperAdmin, asumimos que es Administrador de Evento
      navigate(`/admin/${codigo || 'demo'}`);
    } else if (cod !== '') {
      // Si SOLO pone código (sin contraseña), es un Participante
      navigate(`/turno/${codigo}`);
    } else {
      alert('Por favor ingresa un código de acceso.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Encabezado del Login */}
        <div className="bg-slate-900 p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 border border-slate-700 shadow-inner mb-4">
            <ShieldCheck size={36} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Gestor de Turnos</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Acceso al Sistema 3.0</p>
        </div>

        {/* Formulario */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User size={14} /> Código de Acceso / ID
              </label>
              <input 
                type="text" 
                placeholder="Ej. ev_12345 o a1" 
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-sm transition-all focus:shadow-md focus:bg-white" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Key size={14} /> Contraseña <span className="text-slate-300 font-medium normal-case">(Opcional para participantes)</span>
              </label>
              <div className="relative">
                <input 
                  // AQUÍ CAMBIA EL TIPO DEPENDIENDO DEL ESTADO "mostrarPassword"
                  type={mostrarPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-400 outline-none font-bold text-sm text-slate-700 shadow-sm transition-all focus:shadow-md focus:bg-white" 
                />
                {/* BOTÓN DEL OJITO */}
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                  title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4 text-sm uppercase tracking-wide"
            >
              Entrar al Sistema <ArrowRight size={18} />
            </button>
          </form>
        </div>
        
        {/* Footer del Login */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400">
            ¿No tienes acceso? Solicita tu link al administrador del evento.
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;