import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen';
import InviteScreen from './views/User/InviteScreen'; // <-- NUEVO ARCHIVO QUE CREAREMOS

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} /> 
        <Route path="/super-admin" element={<SuperAdminPanel />} />
        <Route path="/admin/:id" element={<AdminPanel />} />

        {/* --- 1. LINK GENERAL DE INVITACIÓN (Registro) --- */}
        {/* URL Ej: misitio.com/invite/evento-123/admin-XYZ */}
        <Route path="/invite/:eventoId/:adminId" element={<InviteScreen />} />

        {/* --- 2. LINK ÚNICO PERSONAL (Panel del Participante) --- */}
        {/* URL Ej: misitio.com/p/evento-123/admin-XYZ/part-987 */}
        <Route path="/p/:eventoId/:adminId/:participanteId" element={<ParticipantPanel />} />
      </Routes>
    </Router>
  );
}

export default App;