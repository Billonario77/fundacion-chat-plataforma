import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { turnosService } from '../services/turnosService';
import { useAuth } from '../contexts/AuthContext';
import { es } from 'date-fns/locale';

interface CalendarioHorariosProps {
  guiaId: string;
  fechaSeleccionada: Date | null;
  onChange: (fecha: Date | null) => void;
  onHorariosCargados?: (horarios: any[]) => void;
}

const CalendarioHorarios: React.FC<CalendarioHorariosProps> = ({
  guiaId,
  fechaSeleccionada,
  onChange,
  onHorariosCargados
}) => {
  const { user } = useAuth();
  const [horariosOcupados, setHorariosOcupados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  // Cargar horarios ocupados cuando cambia la fecha
  useEffect(() => {
    if (!fechaSeleccionada || !guiaId) return;

    const cargarHorarios = async () => {
      try {
        setCargando(true);
        const fechaStr = fechaSeleccionada.toISOString().split('T')[0];
        const data = await turnosService.getHorariosOcupados(guiaId, fechaStr);
        setHorariosOcupados(data.horarios || []);
        if (onHorariosCargados) {
          onHorariosCargados(data.horarios || []);
        }
      } catch (error) {
        console.error('Error al cargar horarios ocupados:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarHorarios();
  }, [fechaSeleccionada, guiaId]);

  // Función para verificar si una hora está ocupada
  const isHoraOcupada = (fecha: Date) => {
    if (horariosOcupados.length === 0) return false;

    const horaSeleccionada = fecha.getTime();
    
    return horariosOcupados.some(horario => {
      const inicio = new Date(horario.inicio).getTime();
      const fin = new Date(horario.fin).getTime();
      return horaSeleccionada >= inicio && horaSeleccionada < fin;
    });
  };

  // Función para filtrar horas disponibles (excluir ocupadas)
  const filterTime = (time: Date) => {
    return !isHoraOcupada(time);
  };

  // Función para deshabilitar días pasados
  const filterDate = (date: Date) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return date >= hoy;
  };

  return (
    <div className="calendario-container">
      <DatePicker
        selected={fechaSeleccionada}
        onChange={onChange}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={30}
        timeCaption="Hora"
        dateFormat="dd/MM/yyyy HH:mm"
        locale={es}
        minDate={new Date()}
        filterDate={filterDate}
        filterTime={filterTime}
        placeholderText="Selecciona fecha y hora"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primario"
        timeClassName={(time) => {
          return isHoraOcupada(time) ? 'hora-ocupada' : 'hora-disponible';
        }}
        dayClassName={(date) => {
          // Puedes agregar clases para días con turnos ocupados
          return 'dia-normal';
        }}
      />
      {cargando && (
        <p className="text-xs text-gray-500 mt-1">Cargando horarios...</p>
      )}
      {horariosOcupados.length > 0 && fechaSeleccionada && (
        <p className="text-xs text-red-500 mt-1">
          ⚠️ Las horas en rojo no están disponibles
        </p>
      )}
      <style>{`
        .hora-ocupada {
          background-color: #fecaca !important;
          color: #dc2626 !important;
          font-weight: bold !important;
          cursor: not-allowed !important;
        }
        .hora-disponible:hover {
          background-color: #dbeafe !important;
        }
        .react-datepicker__time-list-item--disabled {
          background-color: #fecaca !important;
          color: #dc2626 !important;
          text-decoration: line-through !important;
        }
      `}</style>
    </div>
  );
};

export default CalendarioHorarios;