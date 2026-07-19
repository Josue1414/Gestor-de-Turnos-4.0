import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        <div className="bg-slate-800 p-5 flex justify-between items-center shrink-0">
          <h2 className="text-white font-black flex items-center gap-2 text-lg">
            <ShieldCheck className="text-blue-400" /> Aviso de Privacidad y Términos
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-slate-600 font-medium">
          <p>
            <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-MX')}
          </p>

          <h3 className="text-base font-black text-slate-800">1. Identidad y Propósito</h3>
          <p>
            En cumplimiento con lo establecido en los Artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), te informamos que los datos recabados en esta plataforma ("Gestor de Turnos") tienen como finalidad exclusiva la organización, gestión y asignación de horarios de los eventos correspondientes.
          </p>

          <h3 className="text-base font-black text-slate-800">2. Datos Recabados</h3>
          <p>
            Para el funcionamiento del sistema, recopilamos información básica de contacto e identificación, la cual puede incluir: nombre completo, número de teléfono, fecha de nacimiento y notas operativas relevantes para tu participación.
          </p>

          <h3 className="text-base font-black text-slate-800">3. Uso y Protección de Datos</h3>
          <p>
            Tus datos son almacenados en infraestructuras de bases de datos seguras y son accesibles únicamente por los administradores y supervisores designados del evento. No vendemos, alquilamos ni transferimos tu información a terceros para fines comerciales o de marketing.
          </p>

          <h3 className="text-base font-black text-slate-800">4. Limitación de Responsabilidad</h3>
          <p>
            Los desarrolladores, creadores y administradores técnicos de esta plataforma proveen el sistema como una herramienta de software "tal cual" (as is). Aunque implementamos medidas de seguridad estándar para salvaguardar tu información, <strong>la plataforma y sus desarrolladores no se hacen responsables por el mal uso, extracción no autorizada, robo de datos o acciones maliciosas realizadas por terceros</strong> originadas por vulnerabilidades externas o por negligencia en el manejo de contraseñas y enlaces de acceso por parte de los propios usuarios o administradores del evento.
          </p>

          <h3 className="text-base font-black text-slate-800">5. Consentimiento</h3>
          <p>
            El uso continuo de esta plataforma, así como la marcación de la casilla de aceptación al inicio, constituye tu consentimiento expreso para el tratamiento de tus datos personales conforme a los términos descritos en este documento.
          </p>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition shadow-md">
            Cerrar y Volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;