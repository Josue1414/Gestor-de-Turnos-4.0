import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen'; 
import InviteScreen from './views/User/InviteScreen'; // <-- IMPORTAMOS LA PANTALLA DE INVITACIÓN

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} /> 
        <Route path="/super-admin" element={<SuperAdminPanel />} />
        <Route path="/admin/:id" element={<AdminPanel />} />

        {/* --- NUEVAS RUTAS PARA PARTICIPANTES E INVITADOS --- */}
        {/* Ruta para el link personal del participante */}
        <Route path="/p/:eventoId/:adminId/:participanteId" element={<ParticipantPanel />} />
        
        {/* Ruta general para que se registren los nuevos */}
        <Route path="/invite/:eventoId/:adminId" element={<InviteScreen />} />
      </Routes>
    </Router>
  );
}

export default App;