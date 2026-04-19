import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import CountdownDeleteModal from './CountdownDeleteModal';

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  direccion?: 'derecha' | 'abajo'; // Se mantiene para no romper otros componentes
  tituloEliminar?: string;
  mensajeEliminar?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({ 
  onEdit, 
  onDelete, 
  tituloEliminar = 'Eliminar registro', 
  mensajeEliminar = '¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.' 
}) => {
  // Estado local exclusivo para la alerta de este menú
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100 shadow-sm"
          title="Editar"
        >
          <Edit2 size={16} />
        </button>
        
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm"
          title={tituloEliminar}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* El modal se queda encapsulado aquí, manteniendo el AdminPanel limpio */}
      <CountdownDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={tituloEliminar}
        message={mensajeEliminar}
      />
    </>
  );
};

export default ActionMenu;