import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { CalendarView } from '../components/Calendar/CalendarView';
import { Modal } from '../components/UI/Modal';
import { Button } from '../components/UI/Button';
import { AppointmentForm } from '../components/Forms/AppointmentForm';
import { AppointmentWithDetails } from '../types';

export const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null);
  const [prefilledData, setPrefilledData] = useState<{ professionalId?: string; time?: string }>({});

  const handleAppointmentClick = (appointment: AppointmentWithDetails) => {
    setSelectedAppointment(appointment);
    setPrefilledData({});
    setIsModalOpen(true);
  };

  const handleNewAppointment = (professionalId?: string, time?: string) => {
    setSelectedAppointment(null);
    setPrefilledData({ professionalId, time });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
    setPrefilledData({});
  };

  const handleFormSubmit = () => {
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Agenda" subtitle="Visualize e gerencie seus agendamentos" />
        <Button icon={Plus} onClick={() => handleNewAppointment()}>
          Novo Agendamento
        </Button>
      </div>

      <CalendarView
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onAppointmentClick={handleAppointmentClick}
        onNewAppointment={handleNewAppointment}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        size="lg"
      >
        <AppointmentForm
          appointment={selectedAppointment || undefined}
          prefilledData={prefilledData}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};