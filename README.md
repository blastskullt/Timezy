# 🏥 Timezy Pro - Sistema de Agendamento Profissional

Sistema completo de agendamento para clínicas e consultórios médicos, desenvolvido com React, TypeScript e Supabase.

## 🚀 Deploy Rápido no Netlify

### Pré-requisitos
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Netlify](https://netlify.com) (gratuita)

### 1. Configuração do Supabase

1. **Criar projeto no Supabase:**
   - Acesse [supabase.com](https://supabase.com)
   - Clique em "Start your project"
   - Crie um novo projeto
   - Aguarde a criação (2-3 minutos)

2. **Executar migrações SQL:**
   - No dashboard do Supabase, vá para **SQL Editor**
   - Execute as migrações na ordem:
     - `supabase/migrations/20250630233105_round_spring.sql`
     - `supabase/migrations/20250701001654_rapid_truth.sql`

3. **Criar usuários de teste:**
   - Vá para **Authentication > Users**
   - Clique em **"Add user"**
   - Crie os usuários:
     - **Admin:** `admin@clinic.com` / `admin123` ✅ Email confirmado
     - **Prof 1:** `joao.silva@clinic.com` / `prof123` ✅ Email confirmado
     - **Prof 2:** `maria.costa@clinic.com` / `prof123` ✅ Email confirmado
     - **Prof 3:** `bruno.mattos142@gmail.com` / `0425Lorenna@` ✅ Email confirmado

4. **Obter credenciais:**
   - Vá para **Settings > API**
   - Copie a **Project URL** e **anon public key**

### 2. Deploy no Netlify

#### Opção A: Deploy via Git (Recomendado)
1. Faça push do código para GitHub/GitLab
2. Conecte o repositório no Netlify
3. Configure as variáveis de ambiente:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_publica
   VITE_APP_ENV=production
   ```
4. O deploy será automático

#### Opção B: Deploy Manual
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Instalar dependências
npm ci

# Build do projeto
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### 3. Configuração Pós-Deploy

1. **Verificar funcionamento:**
   - Acesse a URL do deploy
   - Teste login com: `admin@clinic.com` / `admin123`

2. **Configurar domínio personalizado (opcional):**
   - No Netlify: Domain settings > Add custom domain

## 🔧 Solução de Problemas de Deploy

### Erro: "vite: not found"
- ✅ **Solução:** Usar `npm ci` em vez de `npm install`
- ✅ **Build command:** `npm ci && npm run build`
- ✅ **Node version:** 20

### Erro: "Page not found" em rotas
- ✅ **Solução:** Arquivo `_redirects` configurado
- ✅ **Redirect:** `/* /index.html 200`

### Erro de variáveis de ambiente
- ✅ **Verificar:** Variáveis configuradas no painel do Netlify
- ✅ **Formato:** `VITE_` prefix obrigatório

## 🔒 Segurança

- ✅ **RLS habilitado** em todas as tabelas
- ✅ **Headers de segurança** configurados
- ✅ **Validação de dados** no frontend e backend
- ✅ **Rate limiting** para prevenir abuso
- ✅ **Logs de auditoria** para monitoramento

## 📱 Funcionalidades

- **Dashboard** com métricas em tempo real
- **Agenda** com visualização por dia/semana/mês
- **Gestão de profissionais** com horários de trabalho
- **Cadastro de clientes** e histórico
- **Serviços** com preços e durações
- **Locais de atendimento** configuráveis
- **Controle de acesso** por roles (admin/profissional)
- **Tema escuro/claro** automático
- **Responsivo** para mobile e desktop

## 🛠️ Tecnologias

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Deploy:** Netlify
- **Ícones:** Lucide React
- **Datas:** date-fns

## 📚 Documentação

- [Guia de Configuração](./docs/SETUP_INSTRUCTIONS.md)
- [Guia de Segurança](./SECURITY.md)
- [Guia de Deploy](./docs/DEPLOYMENT_SECURITY.md)

## 🆘 Suporte

Para problemas:
1. Verifique os logs do navegador (F12 > Console)
2. Consulte a documentação do Supabase
3. Verifique as configurações de RLS

## 📄 Licença

Este projeto é proprietário e confidencial.

---

**🎉 Pronto! Sua aplicação Timezy Pro está no ar!**