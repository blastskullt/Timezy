# 🚀 Guia de Deploy Seguro - Timezy Pro

## 📋 Checklist Pré-Deploy

### **1. Configuração de Ambiente**
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] `.env` não commitado no repositório
- [ ] Chaves de produção diferentes das de desenvolvimento
- [ ] HTTPS configurado e funcionando

### **2. Supabase - Configuração de Produção**

#### **A. Configurações de Projeto**
```sql
-- 1. Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. Listar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### **B. Configurações de Autenticação**
- [ ] Email confirmation habilitado (se necessário)
- [ ] Rate limiting configurado
- [ ] Redirect URLs configuradas
- [ ] JWT expiry configurado adequadamente

#### **C. Configurações de Banco**
- [ ] Backup automático habilitado
- [ ] Point-in-time recovery configurado
- [ ] Logs de auditoria habilitados
- [ ] Métricas de performance monitoradas

### **3. Frontend - Configurações de Segurança**

#### **A. Headers de Segurança**
```typescript
// vite.config.ts - Configuração para produção
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://*.supabase.co",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '),
      
      // Outros headers de segurança
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    }
  }
});
```

#### **B. Configuração de Build**
```json
// package.json - Scripts de produção
{
  "scripts": {
    "build:prod": "NODE_ENV=production vite build",
    "preview:secure": "vite preview --host --https",
    "security:audit": "npm audit --audit-level moderate",
    "security:check": "npm run security:audit && npm run lint"
  }
}
```

### **4. Netlify - Configuração de Deploy**

#### **A. netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build:prod"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[headers]]
  for = "/*"
  [headers.values]
    # Security Headers
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    
    # Content Security Policy
    Content-Security-Policy = '''
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://*.supabase.co;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    '''

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Configurações de segurança
[context.production.environment]
  NODE_ENV = "production"
  VITE_APP_ENV = "production"
```

#### **B. Variáveis de Ambiente no Netlify**
```bash
# No painel do Netlify, configurar:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
VITE_APP_ENV=production
```

### **5. Monitoramento e Alertas**

#### **A. Configurar Logs no Supabase**
```sql
-- Habilitar logs de auditoria
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Criar função para log de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  user_id UUID,
  details JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO security_logs (event_type, user_id, details, created_at)
  VALUES (event_type, user_id, details, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **B. Alertas de Segurança**
```typescript
// Implementar no frontend
const logSecurityEvent = async (event: string, details: any) => {
  if (import.meta.env.PROD) {
    try {
      await supabase.rpc('log_security_event', {
        event_type: event,
        user_id: user?.id,
        details: details
      });
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  }
};

// Usar em pontos críticos
await logSecurityEvent('login_attempt', { 
  success: true, 
  ip: getClientIP(),
  userAgent: navigator.userAgent 
});
```

### **6. Testes de Segurança**

#### **A. Testes Automatizados**
```typescript
// tests/security.test.ts
describe('Testes de Segurança', () => {
  test('RLS impede acesso não autorizado', async () => {
    // Tentar acessar dados sem autenticação
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
    
    expect(error).toBeTruthy();
    expect(data).toBeNull();
  });

  test('Profissional não vê dados de outros', async () => {
    // Login como profissional
    await supabase.auth.signInWithPassword({
      email: 'prof1@test.com',
      password: 'password'
    });

    // Tentar acessar dados de outro profissional
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('professional_id', 'outro-profissional-id');
    
    expect(data).toHaveLength(0);
  });
});
```

#### **B. Testes Manuais**
1. **Teste de Autenticação:**
   - Tentar acessar rotas protegidas sem login
   - Verificar redirecionamento para login
   - Testar logout e limpeza de sessão

2. **Teste de Autorização:**
   - Login como profissional e tentar acessar dados de admin
   - Verificar se RLS está funcionando
   - Testar diferentes níveis de acesso

3. **Teste de Dados:**
   - Tentar injeção SQL em formulários
   - Verificar sanitização de inputs
   - Testar limites de dados

### **7. Backup e Recovery**

#### **A. Configurar Backup Automático**
```sql
-- No Supabase Dashboard:
-- 1. Ir para Settings > Database
-- 2. Habilitar "Point in Time Recovery"
-- 3. Configurar retenção de backup (7-30 dias)
-- 4. Testar restore em ambiente de staging
```

#### **B. Plano de Disaster Recovery**
1. **Backup de Dados:**
   - Backup automático diário
   - Backup manual antes de deploys
   - Teste de restore mensal

2. **Backup de Configurações:**
   - Exportar políticas RLS
   - Backup de variáveis de ambiente
   - Documentar configurações críticas

### **8. Compliance e Auditoria**

#### **A. LGPD/GDPR Compliance**
```sql
-- Função para anonimizar dados
CREATE OR REPLACE FUNCTION anonymize_user_data(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE clients 
  SET 
    name = 'Usuário Removido',
    email = 'removed@example.com',
    phone = 'REMOVIDO'
  WHERE email = user_email;
  
  -- Log da ação
  INSERT INTO audit_log (action, details, created_at)
  VALUES ('data_anonymization', jsonb_build_object('email', user_email), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### **B. Logs de Auditoria**
```sql
-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (action, table_name, record_id, old_values, new_values)
  VALUES (
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### **9. Checklist Final de Deploy**

#### **Pré-Deploy:**
- [ ] Testes de segurança passando
- [ ] Backup realizado
- [ ] Variáveis de ambiente configuradas
- [ ] Headers de segurança configurados
- [ ] RLS testado e funcionando

#### **Durante Deploy:**
- [ ] Deploy em horário de baixo tráfego
- [ ] Monitoramento ativo
- [ ] Rollback preparado
- [ ] Equipe de suporte disponível

#### **Pós-Deploy:**
- [ ] Testes de fumaça executados
- [ ] Logs monitorados por 24h
- [ ] Performance verificada
- [ ] Usuários notificados (se necessário)
- [ ] Documentação atualizada

### **10. Contatos de Emergência**

- **Supabase Support:** support@supabase.io
- **Netlify Support:** support@netlify.com
- **Equipe de Desenvolvimento:** [seu-email]
- **Responsável de Segurança:** [email-seguranca]

---

**🔒 Lembre-se: Segurança é responsabilidade de todos!**

Mantenha este checklist atualizado e revise regularmente as configurações de segurança.