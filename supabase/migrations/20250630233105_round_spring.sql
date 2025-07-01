/*
  # Migração completa para corrigir todos os problemas

  1. Criar tabelas com estrutura correta
  2. Inserir dados de exemplo com UUIDs válidos
  3. Configurar RLS e políticas de segurança
  4. Criar funções auxiliares
  5. Inserir dados de teste
*/

-- =============================================================================
-- 1. CRIAR EXTENSÕES NECESSÁRIAS
-- =============================================================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão para funções de texto
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- 2. CRIAR TABELAS (SE NÃO EXISTIREM)
-- =============================================================================

-- Tabela de profissionais
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  specialty TEXT NOT NULL,
  locations TEXT[] DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  professional_ids TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de locais de atendimento
CREATE TABLE IF NOT EXISTS service_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. CRIAR FUNÇÃO PARA ATUALIZAR updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. CRIAR TRIGGERS PARA updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_professionals_updated_at ON professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_locations_updated_at ON service_locations;
CREATE TRIGGER update_service_locations_updated_at
  BEFORE UPDATE ON service_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 5. HABILITAR ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. CRIAR FUNÇÕES AUXILIARES PARA RLS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
  professional_exists BOOLEAN;
BEGIN
  -- Buscar email do usuário autenticado
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  -- Se não encontrou o usuário, retornar null
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verificar se existe como profissional
  SELECT EXISTS(
    SELECT 1 FROM professionals 
    WHERE email = user_email
  ) INTO professional_exists;
  
  -- Retornar role baseado na existência como profissional
  IF professional_exists THEN
    RETURN 'professional';
  ELSE
    RETURN 'admin';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_professional_id_by_user(user_id UUID)
RETURNS UUID AS $$
DECLARE
  user_email TEXT;
  prof_id UUID;
BEGIN
  -- Buscar email do usuário
  SELECT email INTO user_email 
  FROM auth.users 
  WHERE id = user_id;
  
  -- Buscar ID do profissional pelo email
  SELECT id INTO prof_id 
  FROM professionals 
  WHERE email = user_email;
  
  RETURN prof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 7. REMOVER POLÍTICAS EXISTENTES
-- =============================================================================

DROP POLICY IF EXISTS "Admins podem gerenciar profissionais" ON professionals;
DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON professionals;
DROP POLICY IF EXISTS "Profissionais podem atualizar seus dados" ON professionals;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar profissionais" ON professionals;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar profissionais" ON professionals;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir profissionais" ON professionals;
DROP POLICY IF EXISTS "Usuários autenticados podem ver profissionais" ON professionals;

DROP POLICY IF EXISTS "Admins podem gerenciar clientes" ON clients;
DROP POLICY IF EXISTS "Profissionais podem ver seus clientes" ON clients;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON clients;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar clientes" ON clients;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir clientes" ON clients;
DROP POLICY IF EXISTS "Usuários autenticados podem ver clientes" ON clients;

DROP POLICY IF EXISTS "Admins podem gerenciar serviços" ON services;
DROP POLICY IF EXISTS "Profissionais podem ver seus serviços" ON services;
DROP POLICY IF EXISTS "Serviços são visíveis publicamente" ON services;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar serviços" ON services;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar serviços" ON services;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir serviços" ON services;
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços" ON services;

DROP POLICY IF EXISTS "Admins podem gerenciar locais" ON service_locations;
DROP POLICY IF EXISTS "Profissionais podem ver locais ativos" ON service_locations;
DROP POLICY IF EXISTS "Locais ativos são visíveis publicamente" ON service_locations;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar locais" ON service_locations;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar locais" ON service_locations;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir locais" ON service_locations;
DROP POLICY IF EXISTS "Usuários autenticados podem ver locais" ON service_locations;

DROP POLICY IF EXISTS "Admins podem gerenciar agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem ver seus agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem atualizar seus agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem criar seus agendamentos" ON appointments;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar agendamentos" ON appointments;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar agendamentos" ON appointments;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir agendamentos" ON appointments;
DROP POLICY IF EXISTS "Usuários autenticados podem ver agendamentos" ON appointments;

-- =============================================================================
-- 8. CRIAR POLÍTICAS RLS
-- =============================================================================

-- Políticas para PROFESSIONALS
CREATE POLICY "Admins podem gerenciar profissionais"
ON professionals FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Profissionais podem ver seus dados"
ON professionals FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND id = get_professional_id_by_user(auth.uid())
);

CREATE POLICY "Profissionais podem atualizar seus dados"
ON professionals FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND id = get_professional_id_by_user(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = 'professional' 
  AND id = get_professional_id_by_user(auth.uid())
);

-- Políticas para CLIENTS
CREATE POLICY "Admins podem gerenciar clientes"
ON clients FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Profissionais podem ver seus clientes"
ON clients FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.client_id = clients.id
    AND a.professional_id = get_professional_id_by_user(auth.uid())
  )
);

-- Políticas para SERVICES
CREATE POLICY "Admins podem gerenciar serviços"
ON services FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Profissionais podem ver seus serviços"
ON services FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND get_professional_id_by_user(auth.uid())::TEXT = ANY(professional_ids)
);

CREATE POLICY "Serviços são visíveis publicamente"
ON services FOR SELECT
TO anon
USING (true);

-- Políticas para SERVICE_LOCATIONS
CREATE POLICY "Admins podem gerenciar locais"
ON service_locations FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Profissionais podem ver locais ativos"
ON service_locations FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND is_active = true
);

CREATE POLICY "Locais ativos são visíveis publicamente"
ON service_locations FOR SELECT
TO anon
USING (is_active = true);

-- Políticas para APPOINTMENTS
CREATE POLICY "Admins podem gerenciar agendamentos"
ON appointments FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Profissionais podem ver seus agendamentos"
ON appointments FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
);

CREATE POLICY "Profissionais podem atualizar seus agendamentos"
ON appointments FOR UPDATE
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
)
WITH CHECK (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
);

CREATE POLICY "Profissionais podem criar seus agendamentos"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
);

-- =============================================================================
-- 9. CRIAR ÍNDICES PARA PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_professionals_email ON professionals(email);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
CREATE INDEX IF NOT EXISTS idx_service_locations_active ON service_locations(is_active);
CREATE INDEX IF NOT EXISTS idx_services_professional_ids ON services USING GIN(professional_ids);

-- =============================================================================
-- 10. INSERIR DADOS DE EXEMPLO
-- =============================================================================

-- Limpar dados existentes (apenas para desenvolvimento)
TRUNCATE TABLE appointments CASCADE;
TRUNCATE TABLE services CASCADE;
TRUNCATE TABLE service_locations CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE professionals CASCADE;

-- Inserir profissionais
INSERT INTO professionals (id, name, email, specialty, locations, availability, created_at, updated_at) VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Dr. João Silva',
  'joao.silva@clinic.com',
  'Cardiologia',
  ARRAY['Consultório Principal', 'Hospital São José'],
  '{
    "monday": [{"start": "08:00", "end": "17:00"}],
    "tuesday": [{"start": "08:00", "end": "17:00"}],
    "wednesday": [{"start": "08:00", "end": "17:00"}],
    "thursday": [{"start": "08:00", "end": "17:00"}],
    "friday": [{"start": "08:00", "end": "12:00"}]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  '22222222-2222-2222-2222-222222222222',
  'Dra. Maria Costa',
  'maria.costa@clinic.com',
  'Dermatologia',
  ARRAY['Consultório Principal'],
  '{
    "monday": [{"start": "09:00", "end": "18:00"}],
    "tuesday": [{"start": "09:00", "end": "18:00"}],
    "wednesday": [{"start": "09:00", "end": "18:00"}],
    "thursday": [{"start": "09:00", "end": "18:00"}],
    "friday": [{"start": "09:00", "end": "15:00"}]
  }'::jsonb,
  NOW(),
  NOW()
),
(
  '33333333-3333-3333-3333-333333333333',
  'Dr. Bruno Mattos',
  'bruno.mattos142@gmail.com',
  'Clínica Geral',
  ARRAY['Consultório Principal'],
  '{
    "monday": [{"start": "08:00", "end": "17:00"}],
    "tuesday": [{"start": "08:00", "end": "17:00"}],
    "wednesday": [{"start": "08:00", "end": "17:00"}],
    "thursday": [{"start": "08:00", "end": "17:00"}],
    "friday": [{"start": "08:00", "end": "17:00"}]
  }'::jsonb,
  NOW(),
  NOW()
);

-- Inserir clientes
INSERT INTO clients (id, name, email, phone, created_at, updated_at) VALUES
(
  '44444444-4444-4444-4444-444444444444',
  'Maria Santos',
  'maria.santos@email.com',
  '(11) 99999-1111',
  NOW(),
  NOW()
),
(
  '55555555-5555-5555-5555-555555555555',
  'João Oliveira',
  'joao.oliveira@email.com',
  '(11) 99999-2222',
  NOW(),
  NOW()
),
(
  '66666666-6666-6666-6666-666666666666',
  'Ana Silva',
  'ana.silva@email.com',
  '(11) 99999-3333',
  NOW(),
  NOW()
);

-- Inserir locais de atendimento
INSERT INTO service_locations (id, name, address, description, is_active, created_at, updated_at) VALUES
(
  '77777777-7777-7777-7777-777777777777',
  'Consultório Principal',
  'Rua das Flores, 123 - Centro',
  'Consultório principal com 3 salas de atendimento',
  true,
  NOW(),
  NOW()
),
(
  '88888888-8888-8888-8888-888888888888',
  'Hospital São José',
  'Av. Paulista, 1000 - Bela Vista',
  'Atendimento hospitalar e emergências',
  true,
  NOW(),
  NOW()
),
(
  '99999999-9999-9999-9999-999999999999',
  'Clínica Anexo',
  'Rua das Palmeiras, 456 - Jardins',
  'Unidade secundária para consultas especializadas',
  true,
  NOW(),
  NOW()
);

-- Inserir serviços
INSERT INTO services (id, name, duration, price, professional_ids, color, created_at, updated_at) VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Consulta Cardiológica',
  60,
  150.00,
  ARRAY['11111111-1111-1111-1111-111111111111'],
  '#3B82F6',
  NOW(),
  NOW()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Consulta Dermatológica',
  45,
  120.00,
  ARRAY['22222222-2222-2222-2222-222222222222'],
  '#10B981',
  NOW(),
  NOW()
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Eletrocardiograma',
  30,
  80.00,
  ARRAY['11111111-1111-1111-1111-111111111111'],
  '#8B5CF6',
  NOW(),
  NOW()
),
(
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'Consulta Clínica Geral',
  45,
  100.00,
  ARRAY['33333333-3333-3333-3333-333333333333'],
  '#F59E0B',
  NOW(),
  NOW()
),
(
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'Dermatoscopia',
  30,
  90.00,
  ARRAY['22222222-2222-2222-2222-222222222222'],
  '#EF4444',
  NOW(),
  NOW()
),
(
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'Consulta de Retorno',
  30,
  80.00,
  ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'],
  '#6366F1',
  NOW(),
  NOW()
);

-- Inserir agendamentos
INSERT INTO appointments (id, client_id, professional_id, service_id, date, time, location, status, notes, created_at, updated_at) VALUES
(
  '10101010-1010-1010-1010-101010101010',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CURRENT_DATE,
  '10:00',
  'Consultório Principal',
  'confirmed',
  'Primeira consulta - paciente com histórico familiar de problemas cardíacos',
  NOW(),
  NOW()
),
(
  '20202020-2020-2020-2020-202020202020',
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  CURRENT_DATE,
  '14:30',
  'Consultório Principal',
  'confirmed',
  'Consulta de rotina - verificar manchas na pele',
  NOW(),
  NOW()
),
(
  '30303030-3030-3030-3030-303030303030',
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  CURRENT_DATE + INTERVAL '1 day',
  '09:00',
  'Consultório Principal',
  'confirmed',
  'Check-up anual',
  NOW(),
  NOW()
),
(
  '40404040-4040-4040-4040-404040404040',
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  CURRENT_DATE + INTERVAL '2 days',
  '11:00',
  'Hospital São José',
  'confirmed',
  'Exame complementar após consulta',
  NOW(),
  NOW()
),
(
  '50505050-5050-5050-5050-505050505050',
  '55555555-5555-5555-5555-555555555555',
  '22222222-2222-2222-2222-222222222222',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  CURRENT_DATE + INTERVAL '3 days',
  '15:00',
  'Consultório Principal',
  'confirmed',
  'Exame dermatoscópico de rotina',
  NOW(),
  NOW()
);

-- =============================================================================
-- 11. FUNÇÃO PARA VERIFICAR CONFIGURAÇÃO
-- =============================================================================

CREATE OR REPLACE FUNCTION verify_system_setup()
RETURNS TABLE(
  component TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Verificar tabelas
  SELECT 
    'Tabelas'::TEXT as component,
    CASE WHEN COUNT(*) = 5 THEN '✅ OK' ELSE '❌ Erro' END as status,
    COUNT(*)::TEXT || ' de 5 tabelas criadas' as details
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('professionals', 'clients', 'services', 'service_locations', 'appointments')
  
  UNION ALL
  
  -- Verificar RLS
  SELECT 
    'RLS'::TEXT as component,
    CASE WHEN COUNT(*) = 5 THEN '✅ OK' ELSE '❌ Erro' END as status,
    COUNT(*)::TEXT || ' de 5 tabelas com RLS habilitado' as details
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename IN ('professionals', 'clients', 'services', 'service_locations', 'appointments')
  AND rowsecurity = true
  
  UNION ALL
  
  -- Verificar políticas
  SELECT 
    'Políticas'::TEXT as component,
    CASE WHEN COUNT(*) >= 10 THEN '✅ OK' ELSE '❌ Erro' END as status,
    COUNT(*)::TEXT || ' políticas criadas' as details
  FROM pg_policies 
  WHERE schemaname = 'public'
  
  UNION ALL
  
  -- Verificar dados
  SELECT 
    'Dados'::TEXT as component,
    '✅ OK'::TEXT as status,
    'Prof: ' || (SELECT COUNT(*) FROM professionals)::TEXT || 
    ', Clientes: ' || (SELECT COUNT(*) FROM clients)::TEXT ||
    ', Serviços: ' || (SELECT COUNT(*) FROM services)::TEXT ||
    ', Locais: ' || (SELECT COUNT(*) FROM service_locations)::TEXT ||
    ', Agendamentos: ' || (SELECT COUNT(*) FROM appointments)::TEXT as details;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 12. FUNÇÃO PARA INSTRUÇÕES DE USUÁRIOS
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_creation_instructions()
RETURNS TEXT AS $$
BEGIN
  RETURN E'INSTRUÇÕES PARA CRIAR USUÁRIOS NO SUPABASE AUTH:\n\n' ||
         E'1. Acesse o Dashboard do Supabase\n' ||
         E'2. Vá para Authentication > Users\n' ||
         E'3. Clique em "Add user"\n' ||
         E'4. Crie os seguintes usuários:\n\n' ||
         E'ADMINISTRADOR:\n' ||
         E'  Email: admin@clinic.com\n' ||
         E'  Senha: admin123\n' ||
         E'  ✅ Marcar "Email Confirmed"\n\n' ||
         E'PROFISSIONAL 1:\n' ||
         E'  Email: joao.silva@clinic.com\n' ||
         E'  Senha: prof123\n' ||
         E'  ✅ Marcar "Email Confirmed"\n\n' ||
         E'PROFISSIONAL 2:\n' ||
         E'  Email: maria.costa@clinic.com\n' ||
         E'  Senha: prof123\n' ||
         E'  ✅ Marcar "Email Confirmed"\n\n' ||
         E'PROFISSIONAL 3:\n' ||
         E'  Email: bruno.mattos142@gmail.com\n' ||
         E'  Senha: 0425Lorenna@\n' ||
         E'  ✅ Marcar "Email Confirmed"\n\n' ||
         E'IMPORTANTE: Os profissionais serão automaticamente\n' ||
         E'vinculados pelos emails cadastrados na tabela professionals.';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 13. EXECUTAR VERIFICAÇÕES FINAIS
-- =============================================================================

-- Verificar configuração do sistema
SELECT * FROM verify_system_setup();

-- Mostrar instruções para criar usuários
SELECT get_user_creation_instructions() as instructions;

-- Verificar se as funções auxiliares estão funcionando
SELECT 
  'Funções auxiliares'::TEXT as component,
  CASE 
    WHEN get_user_role IS NOT NULL AND get_professional_id_by_user IS NOT NULL 
    THEN '✅ OK' 
    ELSE '❌ Erro' 
  END as status,
  'Funções get_user_role e get_professional_id_by_user criadas'::TEXT as details
FROM (
  SELECT 
    (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') as get_user_role,
    (SELECT 1 FROM pg_proc WHERE proname = 'get_professional_id_by_user') as get_professional_id_by_user
) f;