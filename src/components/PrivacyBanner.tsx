import { useState, useEffect } from 'react';
import { ShieldCheck, Info, Check } from 'lucide-react';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const PrivacyBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    // Revisamos si ya aceptó previamente
    const hasAccepted = localStorage.getItem('gestor_privacy_accepted');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAndContinue = () => {
    if (!accepted) return;
    localStorage.setItem('gestor_privacy_accepted', 'true');
    setIsVisible(false);
  };

  // Si ya aceptó o no es visible, no renderizamos nada, dejando la app fluir normal
  if (!isVisible) return null;

  return (
    <>
      {/* Fondo oscuro que bloquea el click a la página de atrás */}
      <div className="fixed inset-0 z-[9998] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
        
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
          
          <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full blur-2xl opacity-50"></div>
            <ShieldCheck size={48} className="mx-auto text-white mb-3 relative z-10" />
            <h2 className="text-2xl font-black text-white relative z-10 tracking-tight">Tu Privacidad</h2>
          </div>

          <div className="p-6 bg-white space-y-4">
            <div className="flex gap-3 items-start bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-slate-700 leading-snug">
                Para que esta plataforma funcione correctamente, guardamos datos básicos necesarios para la asignación de tus turnos. Nos tomamos tu seguridad en serio.
              </p>
            </div>

            <div className="flex items-start gap-3 mt-4">
              <button 
                onClick={() => setAccepted(!accepted)}
                className={`w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors mt-0.5 ${
                  accepted ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                }`}
              >
                {accepted && <Check size={14} strokeWidth={4} />}
              </button>
              <div className="text-sm font-medium text-slate-600">
                He leído y acepto los{' '}
                <button 
                  onClick={() => setShowFullPolicy(true)} 
                  className="text-blue-600 font-bold hover:underline"
                >
                  Términos y el Aviso de Privacidad
                </button>.
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button 
              onClick={handleAcceptAndContinue}
              disabled={!accepted}
              className="w-full py-3.5 rounded-xl font-black text-white uppercase tracking-wider text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none bg-slate-900 hover:bg-slate-800"
            >
              Continuar al sistema
            </button>
          </div>
        </div>
      </div>

      <PrivacyPolicyModal 
        isOpen={showFullPolicy} 
        onClose={() => setShowFullPolicy(false)} 
      />
    </>
  );
};

export default PrivacyBanner;