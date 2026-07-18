import React, { createContext, useContext, useState, useCallback } from 'react';

type Toast = { id: string; message: string; type?: 'info' | 'success' | 'error' };

const ToastContext = createContext<{ showToast: (m: string, t?: Toast['type']) => void } | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const t: Toast = { id, message, type };
    setToasts((s) => [...s, t]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className={`max-w-xs w-full rounded-lg px-4 py-3 shadow-lg text-sm font-bold text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-600' : 'bg-slate-800'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
