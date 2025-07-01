import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, MapPin, Clock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { Professional } from '../types';

export const Professionals: React.FC = () => {
  const { professionals, serviceLocations, addProfessional, updateProfessional, deleteProfessional } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    locations: [] as string[],
    availability: {
      monday: [{ start: '08:00', end: '17:00' }],
      tuesday: [{ start: '08:00', end: '17:00' }],
      wednesday: [{ start: '08:00', end: '17:00' }],
      thursday: [{ start: '08:00', end: '17:00' }],
      friday: [{ start: '08:00', end: '17:00' }]
    }
  });

  const canEdit = user?.role === 'admin';

  const handleOpenModal = (professional?: Professional) => {
    if (!canEdit) return;
    
    if (professional) {
      setSelectedProfessional(professional);
      setFormData({
        name: professional.name,
        email: professional.email,
        specialty: professional.specialty,
        locations: professional.locations,
        availability: professional.availability
      });
    } else {
      setSelectedProfessional(null);
      setFormData({
        name: '',
        email: '',
        specialty: '',
        locations: [],
        availability: {
          monday: [{ start: '08:00', end: '17:00' }],
          tuesday: [{ start: '08:00', end: '17:00' }],
          wednesday: [{ start: '08:00', end: '17:00' }],
          thursday: [{ start: '08:00', end: '17:00' }],
          friday: [{ start: '08:00', end: '17:00' }]
        }
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProfessional) {
      updateProfessional(selectedProfessional.id, formData);
    } else {
      addProfessional(formData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      deleteProfessional(id);
    }
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        locations: [...prev.locations, location]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        locations: prev.locations.filter(l => l !== location)
      }));
    }
  };

  const handleAvailabilityChange = (day: string, field: 'start' | 'end', value: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: [{ ...prev.availability[day][0], [field]: value }]
      }
    }));
  };

  const toggleDayAvailability = (day: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: enabled ? [{ start: '08:00', end: '17:00' }] : []
      }
    }));
  };

  // Obter apenas locais ativos para seleção
  const activeLocations = serviceLocations.filter(location => location.isActive);

  const weekDays = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const formatAvailability = (availability: Professional['availability']) => {
    const workingDays = Object.entries(availability)
      .filter(([_, slots]) => slots.length > 0)
      .map(([day, slots]) => {
        const dayNames = {
          monday: 'Seg',
          tuesday: 'Ter',
          wednesday: 'Qua',
          thursday: 'Qui',
          friday: 'Sex',
          saturday: 'Sáb',
          sunday: 'Dom'
        };
        return `${dayNames[day as keyof typeof dayNames]}: ${slots[0].start}-${slots[0].end}`;
      });
    
    return workingDays.length > 0 ? workingDays.join(', ') : 'Horário não definido';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Profissionais" subtitle="Visualize e gerencie os profissionais da clínica" />
        {canEdit && (
          <Button icon={Plus} onClick={() => handleOpenModal()}>
            Novo Profissional
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Modo Visualização:</strong> Você pode visualizar os profissionais, mas apenas administradores podem editar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map(professional => (
          <Card key={professional.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {professional.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{professional.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{professional.specialty}</p>
                </div>
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenModal(professional)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(professional.id)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span>{professional.email}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>{professional.locations.join(', ')}</span>
              </div>

              <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4 mt-0.5" />
                <span className="text-xs leading-relaxed">
                  {formatAvailability(professional.availability)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {canEdit && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedProfessional ? 'Editar Profissional' : 'Novo Profissional'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Especialidade *
                </label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Locais de Atendimento
                </label>
                {activeLocations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {activeLocations.map(location => (
                      <label key={location.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.locations.includes(location.name)}
                          onChange={(e) => handleLocationChange(location.name, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{location.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                    Nenhum local ativo encontrado. Cadastre locais de atendimento primeiro.
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Horários de Trabalho
                </label>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
                  {weekDays.map(({ key, label }) => {
                    const isEnabled = formData.availability[key]?.length > 0;
                    const timeSlot = formData.availability[key]?.[0];
                    
                    return (
                      <div key={key} className="flex items-center space-x-4">
                        <div className="w-32">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => toggleDayAvailability(key, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {label}
                            </span>
                          </label>
                        </div>
                        
                        {isEnabled && (
                          <div className="flex items-center space-x-2">
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Início
                              </label>
                              <input
                                type="time"
                                value={timeSlot?.start || '08:00'}
                                onChange={(e) => handleAvailabilityChange(key, 'start', e.target.value)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                            <div className="text-gray-400 mt-5">até</div>
                            <div>
                              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                                Fim
                              </label>
                              <input
                                type="time"
                                value={timeSlot?.end || '17:00'}
                                onChange={(e) => handleAvailabilityChange(key, 'end', e.target.value)}
                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Marque os dias da semana em que o profissional trabalha e defina os horários de início e fim.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedProfessional ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};