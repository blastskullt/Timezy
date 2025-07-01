import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para determinar o role do usuário
  const determineUserRole = (authUser: any): User => {
    console.log('🔍 Determinando role para usuário:', authUser.email);
    console.log('📋 Metadados do usuário:', authUser.user_metadata);
    
    // 1. Verificar se há role nos metadados (usuários criados via admin)
    if (authUser.user_metadata?.role) {
      console.log('✅ Role encontrado nos metadados:', authUser.user_metadata.role);
      
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata.name || authUser.email.split('@')[0],
        role: authUser.user_metadata.role,
        professionalId: authUser.user_metadata.professional_id || undefined
      };
    }
    
    // 2. Verificar se é admin pelo email (fallback)
    if (authUser.email === 'admin@clinic.com') {
      console.log('✅ Usuário identificado como ADMIN pelo email');
      return {
        id: authUser.id,
        email: authUser.email,
        name: 'Administrador',
        role: 'admin'
      };
    }

    // 3. Para outros emails, assumir como profissional
    console.log('✅ Usuário identificado como PROFISSIONAL (fallback)');
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.email.split('@')[0],
      role: 'professional',
      professionalId: 'temp-id'
    };
  };

  useEffect(() => {
    console.log('🔄 AuthContext: Inicializando...');
    
    let mounted = true;
    
    // Timeout para evitar loading infinito
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⏰ AuthContext: Timeout atingido - parando loading');
        setIsLoading(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        console.log('🔍 AuthContext: Verificando sessão...');
        
        if (!supabase) {
          throw new Error('Supabase não configurado');
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        clearTimeout(loadingTimeout);
        
        if (error) {
          console.error('❌ AuthContext: Erro na sessão:', error);
          setUser(null);
          setError(`Erro de configuração: ${error.message}`);
        } else if (session?.user) {
          console.log('✅ AuthContext: Sessão encontrada:', session.user.email);
          
          // Determinar role do usuário
          const userData = determineUserRole(session.user);
          console.log('👤 Dados do usuário determinados:', userData);
          
          setUser(userData);
          setError(null);
        } else {
          console.log('ℹ️ AuthContext: Nenhuma sessão ativa');
          setUser(null);
          setError(null);
        }
      } catch (error: any) {
        console.error('❌ AuthContext: Erro crítico:', error);
        if (mounted) {
          clearTimeout(loadingTimeout);
          setUser(null);
          setError(`Erro de inicialização: ${error.message}`);
        }
      } finally {
        if (mounted) {
          console.log('✅ AuthContext: Finalizando inicialização');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 AuthContext: Evento de auth:', event);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔐 Usuário logado:', session.user.email);
          const userData = determineUserRole(session.user);
          console.log('👤 Role determinado:', userData.role);
          setUser(userData);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Usuário deslogado');
          setUser(null);
          setError(null);
        }
        
        // Garantir que o loading pare após eventos de auth
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Tentando login:', email);
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      
      if (error) {
        console.error('❌ AuthContext: Erro no login:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos. Verifique suas credenciais.');
        } else {
          setError(`Erro de login: ${error.message}`);
        }
        return false;
      }
      
      if (data.user) {
        console.log('✅ AuthContext: Login bem-sucedido para:', data.user.email);
        
        // Determinar role do usuário
        const userData = determineUserRole(data.user);
        console.log('👤 Role determinado no login:', userData.role);
        
        setUser(userData);
        return true;
      }
      
      setError('Erro inesperado no login.');
      return false;
    } catch (error: any) {
      console.error('❌ AuthContext: Erro crítico no login:', error);
      setError(`Erro crítico: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('👋 AuthContext: Fazendo logout...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ AuthContext: Erro no logout:', error);
        setError('Erro ao fazer logout.');
      } else {
        console.log('✅ AuthContext: Logout realizado');
        setUser(null);
        setError(null);
      }
    } catch (error: any) {
      console.error('❌ AuthContext: Erro crítico no logout:', error);
      setError(`Erro no logout: ${error.message}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};