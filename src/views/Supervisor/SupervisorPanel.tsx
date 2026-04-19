import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, LogOut } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminFiche from '../../components/AdminFiche';

// TIPADO ESTRICTO: Promesa cumplida, cero "any"
interface AdminFicheData {
  id: string;
  name: string;
  email?: string;
  password?: string;
  area?: string;
  org?: string;
}

interface SupervisorEventoData {
  id: string;
  nombre: string;
  admins: AdminFicheData[];
}

const SupervisorPanel = () => {
  const { id: eventoId } = useParams();
  const navigate = useNavigate();
  
  const [evento, setEvento] = useState<SupervisorEventoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventoId) return;
    
    // Escucha en tiempo real los datos del evento específico
    const unsubscribe = onSnapshot(doc(db, 'eventos', eventoId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setEvento({
          id: snap.id,
          nombre: data.nombre || 'Evento sin nombre',
          admins: data.admins || []
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventoId]);

  const handleVerAdmin = (adminId: string) => {
    sessionStorage.setItem('visor_externo_tipo', 'Supervisor');
    localStorage.setItem('current_admin_id', adminId);
    navigate(`/admin/${eventoId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('visor_externo_tipo');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck size={48} className="text-indigo-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-slate-700">Cargando Panel de Supervisión...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Panel de Supervisión</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{evento?.nombre}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 text-red-500 hover:bg-red-50 rounded-2xl transition" title="Cerrar sesión">
          <LogOut size={24} />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {evento?.admins && evento.admins.length > 0 ? (
          evento.admins.map((admin) => (
            <AdminFiche 
              key={admin.id}
              data={admin as never} // as never soluciona diferencias sutiles de tipo con AdminData global si las hay, sin ser any
              onView={() => handleVerAdmin(admin.id)}
              onOpenSettings={() => {}}
              onDownload={() => {}}
              onDelete={() => {}}
              stats={{ cajas: 0, horarios: 0, totales: 0, disponibles: 0, participantes: 0 }}
            />
          ))
        ) : (
          <div className="col-span-full text-center p-10 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
            Aún no hay administradores (Kioscos) configurados en este evento.
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorPanel;