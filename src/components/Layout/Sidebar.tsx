import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, UserCheck, Settings, LogOut, Moon, Sun, Home, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  console.log('🔍 Sidebar - Usuário atual:', user?.email, 'Role:', user?.role);

  // Itens de navegação base (disponíveis para todos)
  const baseNavItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Agenda' },
    { to: '/professionals', icon: UserCheck, label: 'Profissionais' },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/services', icon: Settings, label: 'Serviços' },
    { to: '/locations', icon: MapPin, label: 'Locais' },
  ];

  // Itens administrativos (apenas para admins)
  const adminNavItems = [
    { to: '/access', icon: Shield, label: 'Controle de Acesso' },
  ];

  // Combinar itens baseado no role do usuário
  const navItems = user?.role === 'admin' 
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;

  console.log('📋 Itens de navegação:', navItems.map(item => item.label));

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-900 shadow-lg flex flex-col backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Timezy</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pro</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
            {item.to === '/access' && user?.role === 'admin' && (
              <span className="ml-auto">
                <Shield className="h-4 w-4 text-current opacity-70" />
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="font-medium">{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>
        
        <div className="px-4 py-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role === 'admin' ? 'Administrador' : 'Profissional'}
            </p>
            {user?.role === 'admin' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};