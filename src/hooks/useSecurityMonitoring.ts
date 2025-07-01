import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logSecurityEvent, loginRateLimiter } from '../lib/security';

export const useSecurityMonitoring = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Monitorar tentativas de acesso não autorizado
    const handleUnauthorizedAccess = () => {
      if (!user) {
        logSecurityEvent('unauthorized_access_attempt', {
          path: window.location.pathname,
          timestamp: new Date().toISOString()
        }, 'medium');
      }
    };

    // Monitorar mudanças de foco (possível tentativa de phishing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logSecurityEvent('page_hidden', { 
          duration: Date.now() 
        }, 'low');
      }
    };

    // Monitorar tentativas de cópia de dados sensíveis
    const handleCopy = (event: ClipboardEvent) => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 100) {
        logSecurityEvent('large_data_copy', {
          length: selection.length,
          containsEmail: /@/.test(selection),
          containsPhone: /\d{10,}/.test(selection)
        }, 'medium');
      }
    };

    // Monitorar tentativas de impressão
    const handlePrint = () => {
      logSecurityEvent('print_attempt', {
        page: window.location.pathname
      }, 'low');
    };

    // Monitorar erros JavaScript (possível tentativa de exploit)
    const handleError = (event: ErrorEvent) => {
      logSecurityEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }, 'medium');
    };

    // Adicionar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('beforeprint', handlePrint);
    window.addEventListener('error', handleError);

    // Verificar acesso não autorizado periodicamente
    const unauthorizedCheck = setInterval(handleUnauthorizedAccess, 30000);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('beforeprint', handlePrint);
      window.removeEventListener('error', handleError);
      clearInterval(unauthorizedCheck);
    };
  }, [user]);

  // Função para reportar atividade suspeita
  const reportSuspiciousActivity = (activity: string, details: any = {}) => {
    logSecurityEvent('suspicious_activity', {
      activity,
      ...details,
      userId: user?.id,
      userRole: user?.role
    }, 'high');
  };

  // Função para verificar rate limiting
  const checkRateLimit = (action: string, identifier: string = 'default'): boolean => {
    const key = `${action}_${identifier}`;
    return loginRateLimiter.isAllowed(key);
  };

  return {
    reportSuspiciousActivity,
    checkRateLimit
  };
};