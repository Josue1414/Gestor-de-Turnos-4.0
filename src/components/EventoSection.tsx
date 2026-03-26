import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ShieldCheck, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventoData, AdminData } from '../hooks/useSuperAdminLogic';
import AdminFiche from './AdminFiche';

interface EventoSectionProps {
  evento: EventoData;
  isDefaultExpanded: boolean;
  onDeleteEvent: (id: string, name: string) => void;
  onOpenSettings: (data: AdminData) => void;
  onDownload: (id: string) => void;
  onView: (id: string) => void;
  onDeleteAdmin: (eventoId: string, adminId: string, adminName: string) => void;
  onAddAdmin: (eventoId: string) => void;
  onEditEvent: (evento: EventoData) => void;
}

const EventoSection: React.FC<EventoSectionProps> = ({ 
  evento, isDefaultExpanded, onDeleteEvent, onOpenSettings, 
  onDownload, onView, onDeleteAdmin, onAddAdmin, onEditEvent
}) => {
  const [isExpanded, setIsExpanded] = useState(isDefaultExpanded);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8; 

  const totalPages = Math.max(1, Math.ceil(evento.admins.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentItems = evento.admins.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <section className="bg-white border-2 border-slate-300 shadow-sm rounded-2xl flex flex-col overflow-hidden transition-all duration-300">
      
      <div className="bg-slate-800 p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-700">
        
        <div className="flex items-center gap-3 flex-1 cursor-pointer group w-full lg:w-auto" onClick={() => setIsExpanded(!isExpanded)}>
          <button className="text-slate-400 group-hover:text-white transition bg-slate-700/50 p-1.5 rounded-lg">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-700 rounded-xl flex items-center justify-center text-blue-400 border border-slate-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate group-hover:text-blue-300 transition">
                  {evento.nombre}
                </h2>
                <button onClick={(e) => { e.stopPropagation(); onAddAdmin(evento.id); }} className="bg-blue-600 hover:bg-blue-500 text-white p-2 px-3 rounded-lg transition shadow-md border border-blue-500 flex items-center gap-1.5 text-xs font-bold shrink-0">
                    <Plus size={14} /> Añadir Admin
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1 sm:mt-2">
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600">Admins: {evento.admins.length}</span>
              <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-slate-600 hidden sm:inline-block">Guardado: {evento.metodoGuardado}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0 w-full lg:w-auto justify-end mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-700 lg:border-none">
            <button onClick={() => onEditEvent(evento)} className="bg-slate-700 hover:bg-slate-600 text-white p-2 sm:px-3 rounded-lg transition shadow-sm border border-slate-600 flex items-center gap-1 text-xs font-bold" title="Editar Detalles del Evento">
              <Edit2 size={14} /> <span className="hidden sm:block">Editar</span>
            </button>
            <button onClick={() => onDeleteEvent(evento.id, evento.nombre)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 rounded-lg transition border border-red-500/30 flex items-center gap-1 text-xs font-bold">
              <Trash2 size={14} /> <span className="hidden sm:block">Borrar</span>
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-50/50 flex flex-col min-h-[220px] animate-in slide-in-from-top-2 duration-200">
          {evento.admins.length > 0 ? (
              <div className="flex flex-wrap gap-4 flex-1 items-start">
              {currentItems.map((item: AdminData) => {
                  
                  const adminDias = evento.diasPorAdmin?.[item.id] || [];
                  const adminParticipantes = evento.participantesPorAdmin?.[item.id] || [];

                  let calcTotales = 0;
                  let calcDisponibles = 0;
                  const calcCajas = adminDias[0]?.cajas?.length || 0;
                  const calcHorarios = adminDias[0]?.horariosMaestros?.length || 0;
                  const calcParticipantesLength = adminParticipantes.length;

                  adminDias.forEach((dia) => {
                    dia.cajas?.forEach((caja) => {
                      calcTotales += caja.turnos?.length || 0;
                      calcDisponibles += caja.turnos?.filter(t => t.participanteId === null || t.participanteId === '').length || 0;
                    });
                  });

                  const dynamicStats = {
                    cajas: calcCajas,
                    horarios: calcHorarios,
                    totales: calcTotales,
                    disponibles: calcDisponibles,
                    participantes: calcParticipantesLength
                  };

                  return (
                    <AdminFiche 
                        key={item.id} 
                        data={item} 
                        stats={dynamicStats}
                        onOpenSettings={onOpenSettings}
                        onDownload={onDownload}
                        onView={onView} 
                        onDelete={(adminId: string, adminName: string) => onDeleteAdmin(evento.id, adminId, adminName)} 
                    />
                  );
              })}
              </div>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[150px] w-full border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                  <ShieldCheck size={48} className="mb-2 text-slate-300"/>
                  <p className="font-bold text-sm">Este evento no tiene administradores todavía.</p>
                  <p className="text-xs text-slate-500 mt-1">Usa el botón "Añadir Admin" en el encabezado.</p>
              </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                <ChevronLeft size={16} /> <span className="text-sm font-bold hidden sm:block">Anterior</span>
              </button>
              <div className="flex gap-1.5 items-center">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-black transition ${safePage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm flex items-center gap-1">
                 <span className="text-sm font-bold hidden sm:block">Siguiente</span> <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default EventoSection;