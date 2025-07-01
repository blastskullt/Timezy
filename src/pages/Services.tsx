import React, { useState } from 'react';
import { Plus, Edit, Trash2, Clock, DollarSign, Users } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { Service } from '../types';

export const Services: React.FC = () => {
  const { services, professionals, addService, updateService, deleteService } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    price: 0,
    professionalIds: [] as string[],
    color: '#3B82F6'
  });

  const canEdit = user?.role === 'admin';

  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899',
    '#14B8A6', '#F97316', '#84CC16', '#6366F1', '#22D3EE', '#A855F7'
  ];

  const handleOpenModal = (service?: Service) => {
    if (!canEdit) return;
    
    if (service) {
      setSelectedService(service);
      setFormData({
        name: service.name,
        duration: service.duration,
        price: service.price,
        professionalIds: service.professionalIds || [],
        color: service.color
      });
    } else {
      setSelectedService(null);
      setFormData({
        name: '',
        duration: 60,
        price: 0,
        professionalIds: [],
        color: '#3B82F6'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedService) {
      updateService(selectedService.id, formData);
    } else {
      addService(formData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      deleteService(id);
    }
  };

  const handleProfessionalChange = (professionalId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        professionalIds: [...prev.professionalIds, professionalId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        professionalIds: prev.professionalIds.filter(id => id !== professionalId)
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Serviços" subtitle="Visualize e gerencie os serviços oferecidos" />
        {canEdit && (
          <Button icon={Plus} onClick={() => handleOpenModal()}>
            Novo Serviço
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Modo Visualização:</strong> Você pode visualizar os serviços, mas apenas administradores podem editar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <Card key={service.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: service.color }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                </div>
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenModal(service)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(service.id)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{service.duration} minutos</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <DollarSign className="h-4 w-4" />
                <span>R$ {service.price.toLocaleString('pt-BR')}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="h-4 w-4" />
                <span>
                  {(service.professionalIds || []).length} profissional(is)
                </span>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profissionais:</p>
                <div className="flex flex-wrap gap-1">
                  {(service.professionalIds || []).map(profId => {
                    const prof = professionals.find(p => p.id === profId);
                    return prof ? (
                      <span key={profId} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {prof.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {canEdit && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedService ? 'Editar Serviço' : 'Novo Serviço'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Serviço *
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
                  Duração (minutos) *
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  required
                  min="15"
                  step="15"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profissionais Habilitados
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {professionals.map(professional => (
                    <label key={professional.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.professionalIds.includes(professional.id)}
                        onChange={(e) => handleProfessionalChange(professional.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {professional.name} - {professional.specialty}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedService ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};