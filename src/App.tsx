// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// --- IMPORTACIONES DE VISTAS ---
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen'; 
import InviteScreen from './views/User/InviteScreen';
import CapitanInviteScreen from './views/User/CapitanInviteScreen'; // <-- NUEVA IMPORTACIÓN
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

    if (location.pathname === '/' && role === 'participante' && savedUrl) {
      navigate(savedUrl, { replace: true });
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
          
          {/* RUTAS SEPARADAS */}
          <Route path="/invite/:eventoId/:adminId" element={<InviteScreen />} />
          <Route path="/invite-team/:eventoId/:adminId/:capitanLink" element={<CapitanInviteScreen />} />
          
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;