// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// --- IMPORTACIONES DE VISTAS ---
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen'; 
import InviteScreen from './views/User/InviteScreen';
import CapitanInviteScreen from './views/User/CapitanInviteScreen';
import SupervisorPanel from './views/Supervisor/SupervisorPanel';

// --- NUEVAS IMPORTACIONES GLOBALES ---
import ToastProvider from './components/ToastProvider'; 
import PrivacyBanner from './components/PrivacyBanner'; 

function SessionHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    const savedUrl = localStorage.getItem('saved_participant_url');
    const lastInviteUrl = localStorage.getItem('last_invite_url');

    // 1. Si es participante y entra a la raíz, redirigir a su panel
    if (location.pathname === '/' && role === 'participante' && savedUrl) {
      navigate(savedUrl, { replace: true });
      return;
    }

    // 2. Gestión de Auto-Login para links directos de participante (/p/...)
    if (location.pathname.startsWith('/p/') && role !== 'participante') {
      // Separamos la URL. Ejemplo: ['', 'p', 'evento123', 'admin456', 'part789']
      const pathParts = location.pathname.split('/').filter(Boolean);
      
      // Si el enlace tiene la estructura completa de un participante
      if (pathParts.length === 4) {
        localStorage.setItem('user_role', 'participante');
        // No redirigimos. Lo dejamos fluir para que el PrivacyBanner no pierda la ruta.
      } else {
        // Si el link está roto o incompleto, lo expulsamos por seguridad
        if (lastInviteUrl) {
          navigate(lastInviteUrl, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    }
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <SessionHandler />
      <ToastProvider>
        <PrivacyBanner />
        <Routes>
          <Route path="/" element={<LoginScreen />} /> 
          <Route path="/super-admin" element={<SuperAdminPanel />} />
          <Route path="/supervisor/:id" element={<SupervisorPanel />} />
          <Route path="/admin/:id" element={<AdminPanel />} />
          <Route path="/p/:eventoId/:adminId/:participanteId" element={<ParticipantPanel />} />
          
          {/* RUTAS SEPARADAS (CON SOPORTE PARA LINK ÚNICO DE PARTICIPANTE) */}
          <Route path="/invite/:eventoId/:adminId" element={<InviteScreen />} />
          <Route path="/invite/:eventoId/:adminId/:participanteId" element={<InviteScreen />} />
          
          <Route path="/invite-team/:eventoId/:adminId/:capitanLink" element={<CapitanInviteScreen />} />
          <Route path="/invite-team/:eventoId/:adminId/:capitanLink/:participanteId" element={<CapitanInviteScreen />} />
          
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;