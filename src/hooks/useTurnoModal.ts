import { useState, useEffect } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTurnoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [turnoData, setTurnoData] = useState<{
    cajaId: string;
    turnoId: string;
    horario: string;
    cajaNombre: string;
    participante: any; 
    turno: any; // <-- Para guardar el estado original
  } | null>(null);

  const [countdown, setCountdown] = useState(3);
  const [cajaEntregada, setCajaEntregada] = useState(false);
  const [cajaDevuelta, setCajaDevuelta] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [isOpen, countdown]);

  const openModal = (cajaId: string, turnoId: string, horario: string, cajaNombre: string, participante: any, turno: any) => {
    setTurnoData({ cajaId, turnoId, horario, cajaNombre, participante, turno });
    setCountdown(3); 
    // Recuperamos los datos de firebase al abrir
    setCajaEntregada(turno?.entregada || false);
    setCajaDevuelta(turno?.devuelta || false);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setTurnoData(null), 200); 
  };

  return { isOpen, openModal, closeModal, turnoData, countdown, cajaEntregada, setCajaEntregada, cajaDevuelta, setCajaDevuelta };
};