import React from 'react';
import { Clock } from 'lucide-react';

interface TimeInputProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
}

const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input 
            type="time"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl py-2 pl-9 pr-2 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
            />
      </div>
    </div>
  );
};

export default TimeInput;