import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen'; // <-- IMPORTAMOS EL LOGIN

function App() {
  return (
    <Router>
      <Routes>
        {/* <-- AHORA EL LOGIN ES LA PÁGINA PRINCIPAL --> */}
        <Route path="/" element={<LoginScreen />} /> 

        {/* Ruta para el Jefe de Jefes */}
        <Route path="/super-admin" element={<SuperAdminPanel />} />

        {/* Ruta para cada administrador */}
        <Route path="/admin/:id" element={<AdminPanel />} />

        {/* Ruta para el usuario final (Participante) */}
        <Route path="/turno/:adminId" element={<ParticipantPanel />} />
      </Routes>
    </Router>
  );
}

export default App;