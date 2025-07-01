import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Professional, Client, Service, ServiceLocation, Appointment, AppointmentWithDetails } from '../types';

interface DataContextType {
  professionals: Professional[];
  clients: Client[];
  services: Service[];
  serviceLocations: ServiceLocation[];
  appointments: Appointment[];
  appointmentsWithDetails: AppointmentWithDetails[];
  isLoading: boolean;
  error: string | null;
  addProfessional: (professional: Omit<Professional, 'id'>) => Promise<void>;
  updateProfessional: (id: string, professional: Partial<Professional>) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addServiceLocation: (location: Omit<ServiceLocation, 'id' | 'createdAt'>) => Promise<void>;
  updateServiceLocation: (id: string, location: Partial<ServiceLocation>) => Promise<void>;
  deleteServiceLocation: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsWithDetails, setAppointmentsWithDetails] = useState<AppointmentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Mudado para false para evitar loading infinito
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Inicializando DataContext...');
    loadData();
  }, []);

  useEffect(() => {
    updateAppointmentsWithDetails();
  }, [professionals, clients, services, appointments]);

  const loadData = async () => {
    try {
      console.log('📊 Carregando dados do Supabase...');
      setIsLoading(true);
      setError(null);

      // Timeout para evitar loading infinito
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), 10000);
      });

      // Carregar todos os dados em paralelo com timeout
      const dataPromise = Promise.all([
        supabase.from('professionals').select('*').order('name'),
        supabase.from('clients').select('*').order('name'),
        supabase.from('services').select('*').order('name'),
        supabase.from('service_locations').select('*').order('name'),
        supabase.from('appointments').select('*').order('date', { ascending: false })
      ]);

      const [
        { data: professionalsData, error: profError },
        { data: clientsData, error: clientsError },
        { data: servicesData, error: servicesError },
        { data: locationsData, error: locationsError },
        { data: appointmentsData, error: appointmentsError }
      ] = await Promise.race([dataPromise, timeoutPromise]) as any;

      // Verificar erros
      const errors = [profError, clientsError, servicesError, locationsError, appointmentsError]
        .filter(Boolean);
      
      if (errors.length > 0) {
        console.error('❌ Erros ao carregar dados:', errors);
        setError(`Erro ao carregar dados: ${errors[0]?.message}`);
        return;
      }

      // Definir dados
      setProfessionals(professionalsData || []);
      setClients(clientsData || []);
      setServices(servicesData || []);
      setServiceLocations(locationsData || []);
      setAppointments(appointmentsData || []);

      console.log('✅ Dados carregados:', {
        professionals: professionalsData?.length || 0,
        clients: clientsData?.length || 0,
        services: servicesData?.length || 0,
        locations: locationsData?.length || 0,
        appointments: appointmentsData?.length || 0
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      setError(`Erro ao carregar dados: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentsWithDetails = () => {
    const detailed = appointments.map(appointment => {
      const client = clients.find(c => c.id === appointment.clientId);
      const professional = professionals.find(p => p.id === appointment.professionalId);
      const service = services.find(s => s.id === appointment.serviceId);
      
      return {
        ...appointment,
        client: client!,
        professional: professional!,
        service: service!
      };
    }).filter(appointment => appointment.client && appointment.professional && appointment.service);
    
    setAppointmentsWithDetails(detailed);
  };

  const refreshData = async () => {
    await loadData();
  };

  // Profissionais
  const addProfessional = async (professional: Omit<Professional, 'id'>) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .insert([professional]);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao adicionar profissional: ${error.message}`);
      throw error;
    }
  };

  const updateProfessional = async (id: string, professional: Partial<Professional>) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .update(professional)
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao atualizar profissional: ${error.message}`);
      throw error;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase
        .from('professionals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao excluir profissional: ${error.message}`);
      throw error;
    }
  };

  // Clientes
  const addClient = async (client: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .insert([{ ...client, created_at: new Date().toISOString() }]);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao adicionar cliente: ${error.message}`);
      throw error;
    }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao atualizar cliente: ${error.message}`);
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao excluir cliente: ${error.message}`);
      throw error;
    }
  };

  // Serviços
  const addService = async (service: Omit<Service, 'id'>) => {
    try {
      const { error } = await supabase
        .from('services')
        .insert([service]);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao adicionar serviço: ${error.message}`);
      throw error;
    }
  };

  const updateService = async (id: string, service: Partial<Service>) => {
    try {
      const { error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao atualizar serviço: ${error.message}`);
      throw error;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao excluir serviço: ${error.message}`);
      throw error;
    }
  };

  // Locais
  const addServiceLocation = async (location: Omit<ServiceLocation, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('service_locations')
        .insert([{ ...location, created_at: new Date().toISOString() }]);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao adicionar local: ${error.message}`);
      throw error;
    }
  };

  const updateServiceLocation = async (id: string, location: Partial<ServiceLocation>) => {
    try {
      const { error } = await supabase
        .from('service_locations')
        .update(location)
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao atualizar local: ${error.message}`);
      throw error;
    }
  };

  const deleteServiceLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao excluir local: ${error.message}`);
      throw error;
    }
  };

  // Agendamentos
  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, created_at: new Date().toISOString() }]);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao adicionar agendamento: ${error.message}`);
      throw error;
    }
  };

  const updateAppointment = async (id: string, appointment: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update(appointment)
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao atualizar agendamento: ${error.message}`);
      throw error;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await loadData();
    } catch (error: any) {
      setError(`Erro ao excluir agendamento: ${error.message}`);
      throw error;
    }
  };

  return (
    <DataContext.Provider value={{
      professionals,
      clients,
      services,
      serviceLocations,
      appointments,
      appointmentsWithDetails,
      isLoading,
      error,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      addClient,
      updateClient,
      deleteClient,
      addService,
      updateService,
      deleteService,
      addServiceLocation,
      updateServiceLocation,
      deleteServiceLocation,
      addAppointment,
      updateAppointment,
      deleteAppointment,
      refreshData
    }}>
      {children}
    </DataContext.Provider>
  );
};