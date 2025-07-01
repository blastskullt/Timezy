import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Layout/Header';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { supabase } from '../lib/supabase';

interface AccessUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  user_metadata?: {
    name?: string;
    role?: string;
    professional_id?: string;
  };
}

export const Access: React.FC = () => {
  const { professionals } = useData();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'admin' as 'admin' | 'professional',
    professionalId: ''
  });

  const canEdit = user?.role === 'admin';

  // Carregar usuários via Edge Function
  const loadUsers = async () => {
    if (!canEdit) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAccessUsers(data.users || []);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setError(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, [canEdit]);

  const handleOpenModal = (accessUser?: AccessUser) => {
    if (!canEdit) return;
    
    setFormData({
      email: accessUser?.email || '',
      password: '',
      name: accessUser?.user_metadata?.name || '',
      role: 'admin', // Padrão para admin
      professionalId: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (formData.role === 'professional' && !formData.professionalId) {
      setError('Por favor, selecione um profissional.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      console.log('📝 Criando usuário com dados:', {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        professionalId: formData.professionalId
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role,
          professionalId: formData.role === 'professional' ? formData.professionalId : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Usuário criado com sucesso:', result);

      await loadUsers();
      setIsModalOpen(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'admin',
        professionalId: ''
      });
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      setError(`Erro ao criar usuário: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!canEdit) return;
    
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Usuário não autenticado');
      }

      // Primeiro, atualizar a lista para verificar se o usuário ainda existe
      const refreshResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const currentUsers = refreshData.users || [];
        
        const userExists = currentUsers.some((u: AccessUser) => u.id === userId);
        if (!userExists) {
          setError('Este usuário não existe mais no sistema. A lista foi atualizada.');
          setAccessUsers(currentUsers);
          return;
        }
      }

      // Proceder com a exclusão
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (errorData.error === 'User not found') {
          setError('Este usuário não foi encontrado no sistema. A lista será atualizada.');
          await loadUsers();
          return;
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      await loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      
      if (error.message.includes('User not found')) {
        setError('Este usuário não foi encontrado no sistema. A lista foi atualizada.');
        await loadUsers();
      } else {
        setError(`Erro ao excluir usuário: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Limpar professionalId se mudou para admin
      ...(name === 'role' && value === 'admin' ? { professionalId: '' } : {})
    }));
  };

  const getProfessionalName = (user: AccessUser) => {
    const userProfessionalId = user.user_metadata?.professional_id;
    if (!userProfessionalId) return '-';
    
    const professional = professionals.find(p => p.id === userProfessionalId);
    return professional ? professional.name : 'Profissional não encontrado';
  };

  const getUserRole = (user: AccessUser) => {
    // Verificar primeiro nos metadados (mais confiável)
    if (user.user_metadata?.role) {
      return user.user_metadata.role;
    }
    
    // Fallback para verificação por email
    if (user.email === 'admin@clinic.com') {
      return 'admin';
    }
    
    // Verificar se existe como profissional
    const isProfessional = professionals.some(p => p.email === user.email);
    return isProfessional ? 'professional' : 'admin';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Header title="Controle de Acesso" subtitle="Gerencie usuários e permissões do sistema" />
        {canEdit && (
          <Button icon={Plus} onClick={() => handleOpenModal()} disabled={isLoading}>
            Novo Usuário
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
          >
            Fechar
          </button>
        </div>
      )}

      {!canEdit && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            <strong>Modo Visualização:</strong> Apenas administradores podem gerenciar usuários de acesso.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando usuários...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessUsers.map(accessUser => {
          const userRole = getUserRole(accessUser);
          
          return (
            <Card key={accessUser.id} hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    userRole === 'admin' 
                      ? 'bg-gradient-to-r from-red-500 to-pink-600' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}>
                    {userRole === 'admin' ? (
                      <Shield className="h-6 w-6 text-white" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {accessUser.user_metadata?.name || 'Usuário'}
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      userRole === 'admin'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                    }`}>
                      {userRole === 'admin' ? 'Administrador' : 'Profissional'}
                    </span>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(accessUser.id)}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span>{accessUser.email}</span>
                </div>
                
                {userRole === 'professional' && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-4 w-4" />
                    <span>{getProfessionalName(accessUser)}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Criado: {new Date(accessUser.created_at).toLocaleDateString('pt-BR')}</div>
                  {accessUser.email_confirmed_at && (
                    <div>Email confirmado: ✅</div>
                  )}
                  {accessUser.last_sign_in_at && (
                    <div>Último acesso: {new Date(accessUser.last_sign_in_at).toLocaleDateString('pt-BR')}</div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {accessUsers.length === 0 && !isLoading && (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nenhum usuário encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {canEdit 
                  ? 'Comece criando usuários para acessar o sistema.'
                  : 'Nenhum usuário foi encontrado.'
                }
              </p>
              {canEdit && (
                <Button onClick={() => handleOpenModal()} disabled={isLoading}>
                  Criar Primeiro Usuário
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
          title="Novo Usuário de Acesso"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="Nome do usuário"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  placeholder="email@exemplo.com"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    placeholder="Senha de acesso"
                    className="w-full p-3 pr-11 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Usuário *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="admin">Administrador</option>
                  <option value="professional">Profissional</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.role === 'admin' 
                    ? 'Acesso completo ao sistema, pode gerenciar todos os dados'
                    : 'Acesso limitado aos próprios agendamentos e dados'
                  }
                </p>
              </div>

              {formData.role === 'professional' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profissional Vinculado *
                  </label>
                  <select
                    name="professionalId"
                    value={formData.professionalId}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Selecione um profissional</option>
                    {professionals.map(professional => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name} - {professional.specialty}
                      </option>
                    ))}
                  </select>
                  {professionals.length === 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      Nenhum profissional cadastrado. Cadastre profissionais primeiro.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ℹ️ Informações Importantes
              </h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• O email será usado como login no sistema</li>
                <li>• A senha deve ser segura e única</li>
                <li>• Administradores têm acesso total ao sistema</li>
                <li>• Profissionais só veem seus próprios dados</li>
                <li>• O email será automaticamente confirmado</li>
                <li>• <strong>Administradores podem acessar todas as funcionalidades</strong></li>
              </ul>
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};