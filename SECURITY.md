# 🔒 Guia de Segurança - Timezy Pro

## 📋 Índice
1. [Configuração Segura do Supabase](#configuração-segura-do-supabase)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Edge Functions](#edge-functions)
5. [Boas Práticas Frontend](#boas-práticas-frontend)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Checklist de Segurança](#checklist-de-segurança)

---

## 🛡️ Configuração Segura do Supabase

### 1. **Chaves do Supabase**

#### ✅ **ANON KEY (Pública)**
- **Uso:** Frontend, operações públicas
- **Exposição:** ✅ Pode ser exposta (é pública por design)
- **Proteção:** RLS (Row Level Security) obrigatório
- **Localização:** `VITE_SUPABASE_ANON_KEY`

#### ❌ **SERVICE ROLE KEY (Privada)**
- **Uso:** Backend, operações administrativas
- **Exposição:** ❌ NUNCA expor no frontend
- **Proteção:** Apenas em Edge Functions ou backend
- **Localização:** Apenas em ambiente servidor

### 2. **Configuração de Políticas RLS**

```sql
-- Exemplo de política segura para tabela de usuários
CREATE POLICY "Usuários podem ver apenas seus dados"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar apenas seus dados"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

---

## 🔐 Variáveis de Ambiente

### **Estrutura Segura**

```bash
# ✅ Correto - Variáveis públicas (VITE_)
VITE_SUPABASE_URL=https://projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# ❌ Incorreto - Nunca no frontend
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_PASSWORD=senha123
```

### **Proteção do .env**

1. **Sempre no .gitignore:**
```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

2. **Usar .env.example:**
```bash
# Copiar template
cp .env.example .env
# Configurar com valores reais
```

3. **Validação em runtime:**
```typescript
if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL não configurada!');
}
```

---

## 🔒 Row Level Security (RLS)

### **Configuração Obrigatória**

#### 1. **Habilitar RLS em todas as tabelas:**
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
```

#### 2. **Políticas por Tipo de Usuário:**

**Administradores:**
```sql
CREATE POLICY "Admins podem ver tudo"
ON appointments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Profissionais:**
```sql
CREATE POLICY "Profissionais veem apenas seus agendamentos"
ON appointments FOR SELECT
TO authenticated
USING (
  professional_id = (
    SELECT professional_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);
```

#### 3. **Políticas para Dados Públicos:**
```sql
-- Dados que podem ser lidos sem autenticação
CREATE POLICY "Serviços são públicos para leitura"
ON services FOR SELECT
TO anon, authenticated
USING (is_public = true);
```

---

## ⚡ Edge Functions

### **Para Operações Sensíveis**

#### 1. **Criar Edge Function:**
```typescript
// supabase/functions/secure-operation/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Usar SERVICE_ROLE_KEY aqui (seguro no servidor)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Verificar autenticação
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Operação sensível aqui
  const { data, error } = await supabase
    .from('sensitive_table')
    .select('*');

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

#### 2. **Chamar do Frontend:**
```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/secure-operation`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## 🌐 Boas Práticas Frontend

### **1. Validação de Dados**
```typescript
// Sempre validar antes de enviar
const validateAppointment = (data: any) => {
  if (!data.client_id || !data.professional_id) {
    throw new Error('Dados obrigatórios ausentes');
  }
  
  // Sanitizar strings
  return {
    ...data,
    notes: data.notes?.trim().substring(0, 500) // Limitar tamanho
  };
};
```

### **2. Tratamento de Erros**
```typescript
const safeOperation = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(validatedData);
      
    if (error) throw error;
    return data;
  } catch (error) {
    // Log para monitoramento
    console.error('Erro na operação:', error);
    
    // Não expor detalhes técnicos ao usuário
    throw new Error('Erro ao salvar agendamento');
  }
};
```

### **3. Rate Limiting**
```typescript
// Implementar debounce para operações frequentes
const debouncedSave = debounce(async (data) => {
  await supabase.from('table').upsert(data);
}, 1000);
```

---

## 📊 Monitoramento e Logs

### **1. Configurar Logs no Supabase**
- Acessar Dashboard → Settings → Logs
- Monitorar tentativas de acesso
- Configurar alertas para atividades suspeitas

### **2. Implementar Logging Frontend**
```typescript
const logSecurityEvent = (event: string, details: any) => {
  if (import.meta.env.PROD) {
    // Enviar para serviço de monitoramento
    fetch('/api/security-log', {
      method: 'POST',
      body: JSON.stringify({
        event,
        details,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      })
    });
  }
};
```

### **3. Métricas de Segurança**
- Tentativas de login falhadas
- Acessos a dados sensíveis
- Operações administrativas
- Erros de autenticação

---

## ✅ Checklist de Segurança

### **Configuração Inicial**
- [ ] `.env` adicionado ao `.gitignore`
- [ ] `.env.example` criado com instruções
- [ ] Variáveis de ambiente validadas no código
- [ ] RLS habilitado em todas as tabelas

### **Políticas de Segurança**
- [ ] Políticas RLS criadas para cada tabela
- [ ] Testadas políticas com diferentes tipos de usuário
- [ ] Dados sensíveis protegidos
- [ ] Acesso anônimo limitado

### **Código Frontend**
- [ ] Validação de dados implementada
- [ ] Tratamento de erros adequado
- [ ] Rate limiting em operações críticas
- [ ] Logs de segurança configurados

### **Monitoramento**
- [ ] Dashboard de logs configurado
- [ ] Alertas para atividades suspeitas
- [ ] Métricas de segurança definidas
- [ ] Plano de resposta a incidentes

### **Produção**
- [ ] HTTPS configurado
- [ ] CSP (Content Security Policy) implementado
- [ ] Headers de segurança configurados
- [ ] Backup e recovery testados

---

## 🚨 Resposta a Incidentes

### **Em caso de vazamento de chaves:**

1. **Imediato:**
   - Revogar chaves comprometidas no Supabase
   - Gerar novas chaves
   - Atualizar aplicação

2. **Investigação:**
   - Verificar logs de acesso
   - Identificar dados acessados
   - Notificar usuários se necessário

3. **Prevenção:**
   - Revisar políticas RLS
   - Implementar monitoramento adicional
   - Treinar equipe sobre segurança

---

## 📞 Contatos de Emergência

- **Suporte Supabase:** support@supabase.io
- **Documentação:** https://supabase.com/docs/guides/auth/row-level-security
- **Comunidade:** https://github.com/supabase/supabase/discussions

---

**⚠️ Lembre-se: Segurança é um processo contínuo, não um destino!**