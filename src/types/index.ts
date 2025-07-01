export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'professional';
  professionalId?: string;
}

export interface Professional {
  id: string;
  name: string;
  email: string;
  specialty: string;
  locations: string[];
  availability: {
    [key: string]: { start: string; end: string }[];
  };
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  professionalIds: string[];
  color: string;
}

export interface ServiceLocation {
  id: string;
  name: string;
  address: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

export interface AppointmentWithDetails extends Appointment {
  client: Client;
  professional: Professional;
  service: Service;
}