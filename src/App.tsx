import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- IMPORTACIONES DE VISTAS ---
import SuperAdminPanel from './views/SuperAdmin/SuperAdminPanel';
import AdminPanel from './views/Admin/AdminPanel';
import ParticipantPanel from './views/User/ParticipantPanel';
import LoginScreen from './views/Login/LoginScreen'; 
import InviteScreen from './views/User/InviteScreen';
import SupervisorPanel from './views/Supervisor/SupervisorPanel';

// --- NUEVAS IMPORTACIONES GLOBALES ---
// Importamos el ToastProvider para que las alertas funcionen en toda la app
import ToastProvider from './components/ToastProvider'; 
// Importamos nuestro nuevo componente de privacidad
import PrivacyBanner from './components/PrivacyBanner'; 

function App() {
  return (
    // El Router maneja la navegación de las URLs
    <Router>
      {/* 
        Paso 1: ToastProvider envuelve toda la lógica visible.
        Esto permite que cualquier componente hijo use el hook useToast().
      */}
      <ToastProvider>
        
        {/* 
          Paso 2: PrivacyBanner se coloca antes de las rutas.
          Como no está atado a una ruta específica, siempre intentará mostrarse.
          Su propia lógica interna (el localStorage) decidirá si se oculta o bloquea la pantalla.
        */}
        <PrivacyBanner />

        {/* 
          Paso 3: Definición de las pantallas de la aplicación.
          Solo se podrá interactuar con ellas si el PrivacyBanner no está bloqueando la vista.
        */}
        <Routes>
          {/* Rutas administrativas */}
          <Route path="/" element={<LoginScreen />} /> 
          <Route path="/super-admin" element={<SuperAdminPanel />} />
          <Route path="/supervisor/:id" element={<SupervisorPanel />} />
          <Route path="/admin/:id" element={<AdminPanel />} />

          {/* Rutas para participantes e invitados */}
          <Route path="/p/:eventoId/:adminId/:participanteId" element={<ParticipantPanel />} />
          
          {/* AÑADIMOS EL PARÁMETRO OPCIONAL :capitanLink? */}
          <Route path="/invite/:eventoId/:adminId/:capitanLink?" element={<InviteScreen />} />
        </Routes>

      </ToastProvider>
    </Router>
  );
}

export default App;