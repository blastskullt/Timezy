import React, { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, Building, ToggleLeft, ToggleRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { ServiceLocation } from '../types';

export const ServiceLocations: React.FC = () => {
  const { serviceLocations, addServiceLocation, updateServiceLocation, deleteServiceLocation } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ServiceLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    isActive: true
  });

  const canEdit = user?.role === 'admin';

  const handleOpenModal = (location?: ServiceLocation) => {
    if (!canEdit) return;
    
    if (location) {
      setSelectedLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        description: location.description || '',
        isActive: location.isActive
      });
    } else {
      setSelectedLocation(null);
      setFormData({
        name: '',
        address: '',
        description: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedLocation) {
      updateServiceLocation(selectedLocation.id, formData);
    } else {
      addServiceLocation(formData);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!canEdit) return;
    if (confirm('Tem certeza que deseja excluir este local? Esta ação não pode ser desfeita.')) {
      deleteServiceLocation(id);
    }
  };

  const toggleLocationStatus = (id: string, currentStatus: boolean) => {
    if (!canEdit) return;
    updateServiceLocation(id, { isActive: !currentStatus });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Locais de Atendimento" subtitle="Visualize e gerencie os locais onde os serviços são prestados" />
        {canEdit && (
          <Button icon={Plus} onClick={() => handleOpenModal()}>
            Novo Local
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Modo Visualização:</strong> Você pode visualizar os locais, mas apenas administradores podem editar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceLocations.map(location => (
          <Card key={location.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  location.isActive 
                    ? 'bg-gradient-to-r from-green-500 to-blue-600' 
                    : 'bg-gray-400'
                }`}>
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{location.name}</h3>
                    {canEdit && (
                      <button
                        onClick={() => toggleLocationStatus(location.id, location.isActive)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {location.isActive ? (
                          <ToggleRight className="h-5 w-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    location.isActive 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {location.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              {canEdit && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleOpenModal(location)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(location.id)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">{location.address}</span>
              </div>
              
              {location.description && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="italic">"{location.description}"</p>
                </div>
              )}
            </div>
          </Card>
        ))}

        {serviceLocations.length === 0 && (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum local cadastrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {canEdit 
                  ? 'Comece cadastrando os locais onde os atendimentos são realizados.'
                  : 'Nenhum local foi cadastrado ainda.'
                }
              </p>
              {canEdit && (
                <Button onClick={() => handleOpenModal()}>
                  Cadastrar Primeiro Local
                </Button>
              )}
            </Card>
          </div>
        )}
      </div>

      {canEdit && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedLocation ? 'Editar Local' : 'Novo Local de Atendimento'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Local *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Consultório Principal, Hospital São José..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endereço *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Rua, número, bairro, cidade..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Informações adicionais sobre o local..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Local ativo (disponível para agendamentos)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedLocation ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};