import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AppointmentWithDetails } from '../../types';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { DayScheduleView } from './DayScheduleView';

type ViewType = 'day' | 'week' | 'month';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithDetails) => void;
  onNewAppointment: (professionalId?: string, time?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  selectedDate,
  onDateChange,
  onAppointmentClick,
  onNewAppointment
}) => {
  const [viewType, setViewType] = useState<ViewType>('week');
  const { appointmentsWithDetails, professionals } = useData();
  const { user } = useAuth();

  const filteredAppointments = user?.role === 'professional'
    ? appointmentsWithDetails.filter(apt => apt.professionalId === user.professionalId)
    : appointmentsWithDetails;

  const getAppointmentsForDate = (date: Date) => {
    return filteredAppointments.filter(appointment =>
      isSameDay(parseISO(appointment.date), date)
    ).sort((a, b) => a.time.localeCompare(b.time));
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewType === 'day') {
      onDateChange(addDays(selectedDate, direction === 'next' ? 1 : -1));
    } else if (viewType === 'week') {
      onDateChange(addWeeks(selectedDate, direction === 'next' ? 1 : -1));
    } else {
      const newDate = direction === 'next' 
        ? addDays(endOfMonth(selectedDate), 1)
        : addDays(startOfMonth(selectedDate), -1);
      onDateChange(newDate);
    }
  };

  const renderAppointmentCard = (appointment: AppointmentWithDetails) => {
    const statusColors = {
      confirmed: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
      cancelled: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
      completed: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
    };

    return (
      <div
        key={appointment.id}
        onClick={() => onAppointmentClick(appointment)}
        className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${statusColors[appointment.status]}`}
        style={{ borderLeftColor: appointment.service.color }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-sm">{appointment.time}</span>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${{
            confirmed: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
            cancelled: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
            completed: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
          }[appointment.status]}`}>
            {appointment.status === 'confirmed' ? 'Confirmado' : 
             appointment.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
          </span>
        </div>
        <p className="font-semibold text-gray-900 dark:text-white mt-1">{appointment.service.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.client.name}</p>
        {user?.role === 'admin' && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{appointment.professional.name}</p>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map(day => {
          const appointments = getAppointmentsForDate(day);
          const isToday = isSameDay(day, new Date());
          
          return (
            <Card key={day.toString()} className={isToday ? 'ring-2 ring-blue-500' : ''}>
              <div className="text-center mb-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={`text-lg font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="space-y-2 min-h-32">
                {appointments.slice(0, 3).map(appointment => (
                  <div
                    key={appointment.id}
                    onClick={() => onAppointmentClick(appointment)}
                    className="p-2 rounded-md text-xs cursor-pointer transition-colors hover:opacity-80"
                    style={{ backgroundColor: appointment.service.color + '20', color: appointment.service.color }}
                  >
                    <p className="font-medium">{appointment.time}</p>
                    <p className="truncate">{appointment.service.name}</p>
                  </div>
                ))}
                {appointments.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    +{appointments.length - 3} mais
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 41);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
        {days.map(day => {
          const appointments = getAppointmentsForDate(day);
          const isCurrentMonth = isSameMonth(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          // Agrupar agendamentos por profissional
          const appointmentsByProfessional = appointments.reduce((acc, apt) => {
            if (!acc[apt.professionalId]) {
              acc[apt.professionalId] = {
                professional: apt.professional,
                appointments: []
              };
            }
            acc[apt.professionalId].appointments.push(apt);
            return acc;
          }, {} as Record<string, { professional: any; appointments: AppointmentWithDetails[] }>);

          return (
            <div
              key={day.toString()}
              onClick={() => onDateChange(day)}
              className={`p-2 min-h-24 border rounded-lg cursor-pointer transition-colors ${
                isCurrentMonth 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
              } ${isToday ? 'ring-2 ring-blue-500' : ''} hover:bg-gray-50 dark:hover:bg-gray-700`}
            >
              <p className={`text-sm font-medium mb-1 ${
                isCurrentMonth 
                  ? isToday 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-900 dark:text-white'
                  : 'text-gray-400 dark:text-gray-600'
              }`}>
                {format(day, 'd')}
              </p>
              
              <div className="space-y-1">
                {Object.values(appointmentsByProfessional).slice(0, 3).map(({ professional, appointments: profAppointments }) => (
                  <div key={professional.id} className="space-y-0.5">
                    {/* Nome do profissional (apenas para admin) */}
                    {user?.role === 'admin' && (
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                        {professional.name.split(' ')[0]}
                      </div>
                    )}
                    
                    {/* Indicadores dos agendamentos */}
                    <div className="flex flex-wrap gap-0.5">
                      {profAppointments.slice(0, 2).map(appointment => (
                        <div
                          key={appointment.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: appointment.service.color }}
                          title={`${appointment.time} - ${appointment.service.name} - ${appointment.client.name}`}
                        />
                      ))}
                      {profAppointments.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{profAppointments.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {Object.keys(appointmentsByProfessional).length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{Object.keys(appointmentsByProfessional).length - 3} prof.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {viewType === 'day' && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {viewType === 'week' && `Semana de ${format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "d 'de' MMM", { locale: ptBR })}`}
            {viewType === 'month' && format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            {(['day', 'week', 'month'] as ViewType[]).map(type => (
              <button
                key={type}
                onClick={() => setViewType(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewType === type
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type === 'day' ? 'Dia' : type === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => navigateDate('prev')}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              onClick={() => navigateDate('next')}
            />
          </div>
        </div>
      </div>

      <div>
        {viewType === 'day' && (
          <DayScheduleView
            selectedDate={selectedDate}
            onAppointmentClick={onAppointmentClick}
            onNewAppointment={onNewAppointment}
          />
        )}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'month' && renderMonthView()}
      </div>
    </div>
  );
};