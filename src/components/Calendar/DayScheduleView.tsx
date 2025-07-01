import React from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AppointmentWithDetails, Professional } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';

interface DayScheduleViewProps {
  selectedDate: Date;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onNewAppointment: (professionalId?: string, time?: string) => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  selectedDate,
  onAppointmentClick,
  onNewAppointment
}) => {
  const { appointmentsWithDetails, professionals } = useData();
  const { user } = useAuth();

  // Filtrar profissionais baseado no tipo de usuário
  const filteredProfessionals = user?.role === 'professional'
    ? professionals.filter(p => p.id === user.professionalId)
    : professionals;

  // Filtrar agendamentos do dia selecionado
  const dayAppointments = appointmentsWithDetails.filter(appointment =>
    isSameDay(parseISO(appointment.date), selectedDate)
  );

  // Gerar horários de 6h às 22h em intervalos de 30 minutos
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 22) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Verificar se um profissional está disponível em um horário
  const isProfessionalAvailable = (professional: Professional, time: string) => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const availability = professional.availability[dayOfWeek];
    
    if (!availability || availability.length === 0) return false;

    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    return availability.some(slot => {
      const [startHours, startMinutes] = slot.start.split(':').map(Number);
      const [endHours, endMinutes] = slot.end.split(':').map(Number);
      const startInMinutes = startHours * 60 + startMinutes;
      const endInMinutes = endHours * 60 + endMinutes;
      
      return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
    });
  };

  // Obter agendamento para um profissional em um horário específico
  const getAppointmentForSlot = (professionalId: string, time: string) => {
    return dayAppointments.find(apt => 
      apt.professionalId === professionalId && apt.time === time
    );
  };

  // Verificar se um horário está ocupado (considerando duração do serviço)
  const isTimeSlotOccupied = (professionalId: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    return dayAppointments.some(apt => {
      if (apt.professionalId !== professionalId) return false;
      
      const [aptHours, aptMinutes] = apt.time.split(':').map(Number);
      const aptTimeInMinutes = aptHours * 60 + aptMinutes;
      const aptEndTime = aptTimeInMinutes + apt.service.duration;
      
      return timeInMinutes >= aptTimeInMinutes && timeInMinutes < aptEndTime;
    });
  };

  const renderTimeSlot = (professional: Professional, time: string) => {
    const appointment = getAppointmentForSlot(professional.id, time);
    const isAvailable = isProfessionalAvailable(professional, time);
    const isOccupied = isTimeSlotOccupied(professional.id, time);

    if (appointment) {
      return (
        <div
          onClick={() => onAppointmentClick(appointment)}
          className="h-12 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md border-l-4"
          style={{ 
            backgroundColor: appointment.service.color + '20',
            borderLeftColor: appointment.service.color 
          }}
        >
          <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
            {appointment.service.name}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {appointment.client.name}
          </div>
        </div>
      );
    }

    if (!isAvailable) {
      return (
        <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-400">Indisponível</span>
        </div>
      );
    }

    if (isOccupied) {
      return (
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <span className="text-xs text-gray-500">Ocupado</span>
        </div>
      );
    }

    return (
      <button
        onClick={() => onNewAppointment(professional.id, time)}
        className="h-12 w-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center justify-center group"
      >
        <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Agenda detalhada por profissional
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header com profissionais */}
            <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: `120px repeat(${filteredProfessionals.length}, 1fr)` }}>
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              {filteredProfessionals.map(professional => (
                <div key={professional.id} className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-xs">
                        {professional.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {professional.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {professional.specialty}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grade de horários */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {timeSlots.map(time => (
                <div 
                  key={time} 
                  className="grid gap-4 items-center"
                  style={{ gridTemplateColumns: `120px repeat(${filteredProfessionals.length}, 1fr)` }}
                >
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center py-2">
                    {time}
                  </div>
                  {filteredProfessionals.map(professional => (
                    <div key={`${professional.id}-${time}`}>
                      {renderTimeSlot(professional, time)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border-l-4 border-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Agendamento</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-dashed border-gray-300 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Disponível</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Ocupado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Indisponível</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};