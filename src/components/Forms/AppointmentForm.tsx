import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput, detectXSS } from '../../lib/security';
import { Button } from '../UI/Button';
import { Appointment } from '../../types';

interface AppointmentFormProps {
  appointment?: Appointment;
  prefilledData?: { professionalId?: string; time?: string };
  onSubmit: () => void;
  onCancel: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  appointment,
  prefilledData,
  onSubmit,
  onCancel
}) => {
  const { clients, professionals, services, serviceLocations, addAppointment, updateAppointment } = useData();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    clientId: appointment?.clientId || '',
    professionalId: appointment?.professionalId || prefilledData?.professionalId || (user?.role === 'professional' ? user.professionalId || '' : ''),
    serviceId: appointment?.serviceId || '',
    date: appointment?.date || new Date().toISOString().split('T')[0],
    time: appointment?.time || prefilledData?.time || '',
    location: appointment?.location || '',
    status: appointment?.status || 'confirmed' as const,
    notes: appointment?.notes || ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (prefilledData) {
      setFormData(prev => ({
        ...prev,
        professionalId: prefilledData.professionalId || prev.professionalId,
        time: prefilledData.time || prev.time
      }));
    }
  }, [prefilledData]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validação básica
    if (!formData.clientId.trim()) {
      errors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.professionalId.trim()) {
      errors.professionalId = 'Profissional é obrigatório';
    }

    if (!formData.serviceId.trim()) {
      errors.serviceId = 'Serviço é obrigatório';
    }

    if (!formData.date) {
      errors.date = 'Data é obrigatória';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = 'Data não pode ser no passado';
      }
    }

    if (!formData.time) {
      errors.time = 'Horário é obrigatório';
    }

    if (!formData.location.trim()) {
      errors.location = 'Local é obrigatório';
    }

    // Validação de segurança
    if (formData.notes && detectXSS(formData.notes)) {
      errors.notes = 'Conteúdo inválido detectado nas observações';
    }

    // Verificar se o profissional selecionado existe
    if (formData.professionalId && !professionals.find(p => p.id === formData.professionalId)) {
      errors.professionalId = 'Profissional inválido selecionado';
    }

    // Verificar se o cliente selecionado existe
    if (formData.clientId && !clients.find(c => c.id === formData.clientId)) {
      errors.clientId = 'Cliente inválido selecionado';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitizar dados antes de enviar
      const sanitizedData = {
        clientId: formData.clientId,
        professionalId: formData.professionalId,
        serviceId: formData.serviceId,
        date: formData.date,
        time: formData.time,
        location: sanitizeInput(formData.location),
        status: formData.status,
        notes: formData.notes ? sanitizeInput(formData.notes) : undefined
      };

      if (appointment) {
        await updateAppointment(appointment.id, sanitizedData);
      } else {
        await addAppointment(sanitizedData);
      }
      
      onSubmit();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      setValidationErrors({ 
        general: 'Erro ao salvar agendamento. Tente novamente.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Sanitizar input em tempo real para campos de texto
    const sanitizedValue = (name === 'notes' || name === 'location') && typeof value === 'string' 
      ? sanitizeInput(value) 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const filteredProfessionals = user?.role === 'professional' 
    ? professionals.filter(p => p.id === user.professionalId)
    : professionals;

  const availableServices = services.filter(service => 
    service.professionalIds.includes(formData.professionalId)
  );

  const selectedProfessional = professionals.find(p => p.id === formData.professionalId);

  // Obter locais disponíveis baseado no profissional selecionado
  const getAvailableLocations = () => {
    if (!selectedProfessional) return [];
    
    // Filtrar locais ativos que o profissional atende
    return serviceLocations.filter(location => 
      location.isActive && selectedProfessional.locations.includes(location.name)
    );
  };

  const availableLocations = getAvailableLocations();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationErrors.general && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{validationErrors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cliente *
          </label>
          <select
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.clientId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione um cliente</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {validationErrors.clientId && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.clientId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Profissional *
          </label>
          <select
            name="professionalId"
            value={formData.professionalId}
            onChange={handleChange}
            required
            disabled={user?.role === 'professional' || isSubmitting}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.professionalId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione um profissional</option>
            {filteredProfessionals.map(professional => (
              <option key={professional.id} value={professional.id}>
                {professional.name} - {professional.specialty}
              </option>
            ))}
          </select>
          {validationErrors.professionalId && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.professionalId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Serviço *
          </label>
          <select
            name="serviceId"
            value={formData.serviceId}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.serviceId ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione um serviço</option>
            {availableServices.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - {service.duration}min - R$ {service.price}
              </option>
            ))}
          </select>
          {validationErrors.serviceId && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.serviceId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.date ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {validationErrors.date && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Horário *
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.time ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {validationErrors.time && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.time}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Local *
          </label>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.location ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <option value="">Selecione o local</option>
            {availableLocations.map(location => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
          {validationErrors.location && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.location}</p>
          )}
          {availableLocations.length === 0 && formData.professionalId && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Nenhum local ativo encontrado para este profissional. Verifique o cadastro de locais.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
          >
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
            <option value="completed">Concluído</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            disabled={isSubmitting}
            maxLength={500}
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 ${
              validationErrors.notes ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder="Observações sobre o agendamento..."
          />
          {validationErrors.notes && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.notes}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.notes.length}/500 caracteres
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button 
          variant="secondary" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : (appointment ? 'Atualizar' : 'Agendar')}
        </Button>
      </div>
    </form>
  );
};