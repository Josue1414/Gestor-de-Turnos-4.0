import React, { InputHTMLAttributes, ChangeEvent } from 'react';
import { XCircle, Search } from 'lucide-react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onClear: () => void;
  variant?: 'light' | 'dark'; // NUEVO: para adaptar el color
  showSearchIcon?: boolean;   // OPCIONAL: para el buscador
}

const TextInput: React.FC<TextInputProps> = ({ 
  value, onClear, onChange, variant = 'light', showSearchIcon = false, className = '', ...props 
}) => {
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
  };

  // Lógica de colores según la variante
  const variantClasses = variant === 'dark' 
    ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900 focus:border-blue-500' 
    : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500';

  return (
    <div className="relative w-full group">
      {showSearchIcon && (
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      )}
      
      <input 
        type="text"
        value={value}
        onChange={handleInputChange}
        spellCheck={false} // Quitamos la línea roja del corrector
        className={`w-full border-2 rounded-xl py-2.5 transition shadow-sm outline-none ${showSearchIcon ? 'pl-10' : 'pl-4'} pr-10 ${variantClasses} ${className}`}
        {...props}
      />
      
      {value && (
        <button 
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100 focus:opacity-100"
        >
          <XCircle size={18} />
        </button>
      )}
    </div>
  );
};

export default TextInput;