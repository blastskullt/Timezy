# 🚀 Instruções de Configuração - Timezy Pro

## 📋 Pré-requisitos

1. **Conta no Supabase** - [Criar conta gratuita](https://supabase.com)
2. **Node.js 18+** - [Download](https://nodejs.org)
3. **Git** - [Download](https://git-scm.com)

## 🔧 Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma nova organização (se necessário)
4. Clique em "New Project"
5. Preencha:
   - **Name:** `timezy-pro`
   - **Database Password:** Crie uma senha forte
   - **Region:** Escolha a região mais próxima
6. Clique em "Create new project"
7. Aguarde a criação (pode levar alguns minutos)

### 2. Executar Migrações SQL

1. No dashboard do Supabase, vá para **SQL Editor**
2. Execute as migrações na ordem:

#### Migração 1: Configuração de Segurança
```sql
-- Copie e cole o conteúdo de: supabase/migrations/20250630195610_wispy_crystal.sql
-- Execute clicando em "Run"
```

#### Migração 2: Dados Iniciais
```sql
-- Copie e cole o conteúdo de: supabase/migrations/20250630200000_create_test_users.sql
-- Execute clicando em "Run"
```

### 3. Criar Usuários de Teste

1. No dashboard do Supabase, vá para **Authentication > Users**
2. Clique em **"Add user"**
3. Crie os seguintes usuários:

#### Usuário Administrador
- **Email:** `admin@clinic.com`
- **Password:** `admin123`
- **Email Confirm:** ✅ Marcar como confirmado
- **Auto Confirm User:** ✅ Ativar

#### Usuário Profissional 1
- **Email:** `joao.silva@clinic.com`
- **Password:** `prof123`
- **Email Confirm:** ✅ Marcar como confirmado
- **Auto Confirm User:** ✅ Ativar

#### Usuário Profissional 2
- **Email:** `maria.costa@clinic.com`
- **Password:** `prof123`
- **Email Confirm:** ✅ Marcar como confirmado
- **Auto Confirm User:** ✅ Ativar

#### Usuário Profissional 3
- **Email:** `bruno.mattos142@gmail.com`
- **Password:** `0425Lorenna@`
- **Email Confirm:** ✅ Marcar como confirmado
- **Auto Confirm User:** ✅ Ativar

### 4. Configurar Variáveis de Ambiente

1. No dashboard do Supabase, vá para **Settings > API**
2. Copie as seguintes informações:
   - **Project URL**
   - **anon public key**

3. No projeto, copie o arquivo de exemplo:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:
```bash
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica_aqui
VITE_APP_ENV=development
```

## 🏃‍♂️ Executar o Projeto

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

### 3. Acessar a Aplicação
- Abra o navegador em: `http://localhost:5173`
- Use uma das credenciais de teste para fazer login

## ✅ Verificar Configuração

### 1. Testar Login
- Acesse a página de login
- Teste com as credenciais do administrador: `admin@clinic.com` / `admin123`
- Verifique se o dashboard carrega corretamente

### 2. Verificar Dados
- Navegue pelas seções: Profissionais, Clientes, Serviços, Locais
- Verifique se os dados de exemplo estão carregando
- Teste criar um novo agendamento

### 3. Testar Permissões
- Faça login como profissional: `joao.silva@clinic.com` / `prof123`
- Verifique se só consegue ver seus próprios agendamentos
- Confirme que não consegue acessar a seção "Controle de Acesso"

## 🔒 Configurações de Segurança

### 1. Verificar RLS (Row Level Security)
No SQL Editor do Supabase, execute:
```sql
SELECT * FROM test_security_policies();
```

Deve retornar todas as tabelas com RLS habilitado e políticas configuradas.

### 2. Testar Políticas de Segurança
1. Faça login como profissional
2. Tente acessar dados de outros profissionais
3. Confirme que o acesso é negado

## 🚀 Deploy em Produção

### 1. Configurar Netlify
1. Crie conta no [Netlify](https://netlify.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_ENV=production`

### 2. Configurar Domínio Personalizado (Opcional)
1. No Netlify, vá para **Domain settings**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

### 3. Configurar HTTPS
- O Netlify configura HTTPS automaticamente
- Verifique se o certificado SSL está ativo

## 🆘 Solução de Problemas

### Erro: "Invalid login credentials"
- ✅ Verifique se os usuários foram criados no Supabase Auth
- ✅ Confirme que os emails estão marcados como confirmados
- ✅ Teste com credenciais exatas (case-sensitive)

### Erro: "useAuth must be used within an AuthProvider"
- ✅ Verifique se o AuthProvider está envolvendo a aplicação
- ✅ Confirme que as variáveis de ambiente estão corretas

### Dados não carregam
- ✅ Verifique se as migrações SQL foram executadas
- ✅ Confirme que o RLS está configurado corretamente
- ✅ Teste a conexão com o Supabase

### Erro de CORS
- ✅ Verifique se a URL do projeto está correta
- ✅ Confirme que está usando HTTPS em produção

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs do navegador** (F12 > Console)
2. **Consulte a documentação** do Supabase
3. **Verifique as configurações** de RLS no dashboard

## 📚 Recursos Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentação do React](https://react.dev)
- [Guia do Tailwind CSS](https://tailwindcss.com/docs)

---

**🎉 Parabéns! Sua aplicação Timezy Pro está configurada e pronta para uso!**