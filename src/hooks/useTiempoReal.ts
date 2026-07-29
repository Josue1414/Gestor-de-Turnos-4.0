// src/hooks/useTiempoReal.ts
import { useState, useEffect } from 'react';

/**
 * Hook para obtener la hora y fecha actual del dispositivo.
 * Se actualiza automáticamente cada 60 segundos para optimizar el rendimiento.
 */
export const useTiempoReal = () => {
  const [horaActual, setHoraActual] = useState(new Date());

  useEffect(() => {
    // Calculamos los milisegundos restantes para el próximo minuto exacto.
    // Esto asegura que el cambio de color ocurra justo cuando el reloj cambia de minuto.
    const milisegundosParaProximoMinuto = 60000 - (horaActual.getSeconds() * 1000 + horaActual.getMilliseconds());

    let intervalo: NodeJS.Timeout;

    const timeout = setTimeout(() => {
      setHoraActual(new Date());
      // A partir de aquí, actualizamos cada 60.000 ms (1 minuto) exacto
      intervalo = setInterval(() => {
        setHoraActual(new Date());
      }, 60000);
    }, milisegundosParaProximoMinuto);

    // Limpieza al desmontar para evitar fugas de memoria
    return () => {
      clearTimeout(timeout);
      if (intervalo) clearInterval(intervalo);
    };
  }, [horaActual]);

  return horaActual;
};