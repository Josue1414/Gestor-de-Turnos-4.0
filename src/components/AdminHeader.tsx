import React from 'react';
import { MapIcon, ArrowLeft, LogOut, Settings } from 'lucide-react';

interface AdminInfo {
  name: string;
  org: string;
}

interface StatsData {
  cajas: number;
  horarios: number;
  totales: number;
  disponibles: number;
  participantes: number;
  inactivos: number;
}

interface AdminHeaderProps {
  seccionName: string;
  setSeccionName: (name: string) => void;
  isEditingTitle: boolean;
  setIsEditingTitle: (val: boolean) => void;
  onOpenProfile: () => void;
  onSave: () => void;
  onShowCroquis: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  isSuperAdminViewing?: boolean;
  adminInfo?: AdminInfo | null;
  stats?: StatsData;
}

const MiniStatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border shadow-sm ${color} min-w-[3.5rem] sm:min-w-[4.5rem] flex-1 sm:flex-none`}>
    <span className="text-xs sm:text-sm font-black leading-none">{value}</span>
    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 mt-0.5">{label}</span>
  </div>
);

const AdminHeader: React.FC<AdminHeaderProps> = ({
  seccionName, setSeccionName, isEditingTitle, setIsEditingTitle,
  onOpenProfile, onSave, onShowCroquis, onBack, onLogout, isSuperAdminViewing, adminInfo, stats
}) => {
  return (
    <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-slate-200 mb-4 gap-4 w-full">
      
      {/* IZQUIERDA: Info del Evento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
        <div className="flex-1 w-full sm:w-auto">
          {isEditingTitle && !isSuperAdminViewing ? (
            <input 
              type="text" value={seccionName} onChange={(e) => setSeccionName(e.target.value)} 
              onBlur={onSave} autoFocus
              className="text-xl sm:text-2xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 outline-none w-full"
            />
          ) : (
            <h1 
              className={`text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 ${!isSuperAdminViewing ? 'cursor-pointer hover:text-blue-600 transition' : ''}`}
              onClick={() => !isSuperAdminViewing && setIsEditingTitle(true)}
              title={!isSuperAdminViewing ? "Clic para editar el nombre del evento" : ""}
            >
              {seccionName || 'Sin Título'}
            </h1>
          )}
          {adminInfo && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">
                Admin: {adminInfo.name}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-500 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                {adminInfo.org}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CENTRO: Mini Estadísticas (Con el inactivo que funciona) */}
      {stats && (
        <div className="w-full xl:w-auto flex justify-center py-2 border-y xl:border-y-0 xl:border-x border-slate-100 xl:px-4">
           <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center w-full">
             <MiniStatCard label="Cajas" value={stats.cajas} color="bg-blue-50 text-blue-700 border-blue-100" />
             <MiniStatCard label="Horarios" value={stats.horarios} color="bg-indigo-50 text-indigo-700 border-indigo-100" />
             <MiniStatCard label="Turnos" value={stats.totales} color="bg-purple-50 text-purple-700 border-purple-100" />
             <MiniStatCard label="Libres" value={stats.disponibles} color="bg-emerald-50 text-emerald-700 border-emerald-100" />
             <MiniStatCard label="Usuarios" value={stats.participantes} color="bg-amber-50 text-amber-700 border-amber-100" />
             <MiniStatCard label="Inactivos" value={stats.inactivos} color="bg-red-50 text-red-700 border-red-100" />
           </div>
        </div>
      )}

      {/* DERECHA: Botones de Acción (Reacomodados) */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0 w-full xl:w-auto">
         <button onClick={onOpenProfile} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition shadow-sm border border-slate-200">
            <Settings size={16} /> <span className="hidden sm:inline">Ajustes</span>
         </button>
         <button onClick={onShowCroquis} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700 transition shadow-sm">
            <MapIcon size={16} /> Croquis
         </button>
         {onBack && (
           <button onClick={onBack} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-white text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition shadow-sm border border-slate-200">
              <ArrowLeft size={16} /> Regresar
           </button>
         )}
         {onLogout && (
           <button onClick={onLogout} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition shadow-sm border border-red-100">
              <LogOut size={16} /> Salir
           </button>
         )}
      </div>
    </header>
  );
};

export default AdminHeader;