import React from 'react';
import { Calendar, Users, UserCheck, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';

export const Dashboard: React.FC = () => {
  const { appointmentsWithDetails, clients, professionals, services } = useData();
  const { user } = useAuth();

  const filteredAppointments = user?.role === 'professional'
    ? appointmentsWithDetails.filter(apt => apt.professionalId === user.professionalId)
    : appointmentsWithDetails;

  const todayAppointments = filteredAppointments.filter(apt => isToday(new Date(apt.date)));
  const tomorrowAppointments = filteredAppointments.filter(apt => isTomorrow(new Date(apt.date)));
  const confirmedAppointments = filteredAppointments.filter(apt => apt.status === 'confirmed');
  const completedAppointments = filteredAppointments.filter(apt => apt.status === 'completed');

  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.service.price, 0);

  const stats = [
    {
      title: 'Agendamentos Hoje',
      value: todayAppointments.length,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      title: 'Agendamentos Confirmados',
      value: confirmedAppointments.length,
      icon: Clock,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      title: user?.role === 'admin' ? 'Total de Clientes' : 'Meus Clientes',
      value: user?.role === 'admin' ? clients.length : new Set(filteredAppointments.map(apt => apt.clientId)).size,
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      title: 'Receita Total',
      value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    }
  ];

  return (
    <div className="space-y-6">
      <Header 
        title={`Bem-vindo, ${user?.name}!`}
        subtitle={`Dashboard ${user?.role === 'admin' ? 'Administrativo' : 'Profissional'}`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} hover>
            <div className="flex items-center">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agendamentos de Hoje</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{appointment.time}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.client.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{appointment.service.name}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${{
                    confirmed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                    cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                    completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                  }[appointment.status]}`}>
                    {appointment.status === 'confirmed' ? 'Confirmado' :
                     appointment.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum agendamento para hoje
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Próximos Agendamentos</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {tomorrowAppointments.length > 0 ? (
              tomorrowAppointments.slice(0, 5).map(appointment => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(appointment.date), "d 'de' MMM", { locale: ptBR })} - {appointment.time}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.client.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{appointment.service.name}</p>
                  </div>
                  {user?.role === 'admin' && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">{appointment.professional.name}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum agendamento próximo
              </p>
            )}
          </div>
        </Card>
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profissionais</h3>
              <UserCheck className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {professionals.slice(0, 3).map(professional => (
                <div key={professional.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {professional.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{professional.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{professional.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Serviços Populares</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {services.slice(0, 3).map(service => {
                const serviceAppointments = filteredAppointments.filter(apt => apt.serviceId === service.id);
                return (
                  <div key={service.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">R$ {service.price}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {serviceAppointments.length} agendamentos
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Clientes Recentes</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {clients.slice(0, 3).map(client => (
                <div key={client.id} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};