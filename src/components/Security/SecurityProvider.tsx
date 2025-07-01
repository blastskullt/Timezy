import React, { createContext, useContext, useEffect } from 'react';
import { initSecurityMonitoring } from '../../lib/security';
import { useSecurityMonitoring } from '../../hooks/useSecurityMonitoring';

interface SecurityContextType {
  reportSuspiciousActivity: (activity: string, details?: any) => void;
  checkRateLimit: (action: string, identifier?: string) => boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within SecurityProvider');
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { reportSuspiciousActivity, checkRateLimit } = useSecurityMonitoring();

  useEffect(() => {
    // Inicializar monitoramento de segurança
    initSecurityMonitoring();

    // Adicionar meta tag para CSP se não existir
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const cspMeta = document.createElement('meta');
      cspMeta.httpEquiv = 'Content-Security-Policy';
      cspMeta.content = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
      document.head.appendChild(cspMeta);
    }

    // Adicionar outros headers de segurança via meta tags
    const securityMetas = [
      { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
      { httpEquiv: 'X-Frame-Options', content: 'DENY' }
    ];

    securityMetas.forEach(meta => {
      if (!document.querySelector(`meta[${meta.name ? 'name' : 'http-equiv'}="${meta.name || meta.httpEquiv}"]`)) {
        const metaElement = document.createElement('meta');
        if (meta.name) metaElement.name = meta.name;
        if (meta.httpEquiv) metaElement.httpEquiv = meta.httpEquiv;
        metaElement.content = meta.content;
        document.head.appendChild(metaElement);
      }
    });

  }, []);

  return (
    <SecurityContext.Provider value={{ reportSuspiciousActivity, checkRateLimit }}>
      {children}
    </SecurityContext.Provider>
  );
};