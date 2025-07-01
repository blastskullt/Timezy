// Utilitários de segurança para produção
import { supabase } from './supabase';

// Rate limiting simples no frontend
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 5 tentativas em 15 min
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Rate limiter para login
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

// Sanitização de dados
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limitar tamanho
};

// Validação de email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validação de senha forte
export const isStrongPassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Log de eventos de segurança
export const logSecurityEvent = async (
  event: string, 
  details: Record<string, any> = {},
  severity: 'low' | 'medium' | 'high' = 'medium'
) => {
  if (!import.meta.env.PROD) return;

  try {
    const eventData = {
      event,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        severity
      }
    };

    // Em produção, enviar para serviço de monitoramento
    console.log('Security Event:', eventData);
    
    // Opcional: Enviar para Supabase ou serviço de log
    // await supabase.from('security_logs').insert(eventData);
    
  } catch (error) {
    console.error('Erro ao registrar evento de segurança:', error);
  }
};

// Detectar tentativas de XSS
export const detectXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

// Validação de CSRF token (se implementado)
export const validateCSRFToken = (token: string): boolean => {
  // Implementar validação de CSRF se necessário
  return token && token.length > 10;
};

// Função para mascarar dados sensíveis em logs
export const maskSensitiveData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  
  const masked = { ...data };
  const sensitiveFields = ['password', 'token', 'key', 'secret', 'credit_card', 'ssn'];
  
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }
  
  return masked;
};

// Verificar se está em ambiente seguro (HTTPS)
export const isSecureContext = (): boolean => {
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
};

// Gerar nonce para CSP
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Verificar integridade de dados
export const verifyDataIntegrity = (data: any, expectedHash?: string): boolean => {
  if (!expectedHash) return true;
  
  // Implementar verificação de hash se necessário
  const dataString = JSON.stringify(data);
  // const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataString));
  
  return true; // Placeholder
};

// Configurações de segurança para produção
export const securityConfig = {
  // Timeouts
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
  inactivityTimeout: 30 * 60 * 1000, // 30 minutos
  
  // Rate limiting
  maxLoginAttempts: 5,
  loginCooldown: 15 * 60 * 1000, // 15 minutos
  
  // Validação
  maxInputLength: 1000,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  
  // Headers de segurança
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
};

// Inicializar monitoramento de segurança
export const initSecurityMonitoring = () => {
  // Verificar contexto seguro
  if (!isSecureContext() && import.meta.env.PROD) {
    logSecurityEvent('insecure_context', { protocol: window.location.protocol }, 'high');
  }
  
  // Monitorar tentativas de manipulação do console
  if (import.meta.env.PROD) {
    const originalConsole = { ...console };
    console.log = (...args) => {
      logSecurityEvent('console_access', { args: args.slice(0, 2) }, 'low');
      originalConsole.log(...args);
    };
  }
  
  // Detectar ferramentas de desenvolvedor
  let devtools = { open: false, orientation: null };
  const threshold = 160;
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        logSecurityEvent('devtools_opened', {}, 'medium');
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};