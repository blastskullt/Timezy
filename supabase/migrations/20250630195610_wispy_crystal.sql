/*
  # Configuração de Segurança RLS para Timezy Pro

  1. Habilitar RLS em todas as tabelas
  2. Criar função auxiliar para verificar roles
  3. Implementar políticas de segurança granulares
  4. Otimizar performance com índices
  5. Documentar políticas para manutenção
*/

-- =============================================================================
-- 1. HABILITAR ROW LEVEL SECURITY EM TODAS AS TABELAS
-- =============================================================================

ALTER TABLE IF EXISTS professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. FUNÇÃO AUXILIAR PARA VERIFICAR ROLE DO USUÁRIO
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

-- =============================================================================
-- 3. FUNÇÃO AUXILIAR PARA OBTER ID DO PROFISSIONAL
-- =============================================================================

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
-- 4. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
-- =============================================================================

DROP POLICY IF EXISTS "Admins podem gerenciar profissionais" ON professionals;
DROP POLICY IF EXISTS "Profissionais podem ver seus dados" ON professionals;
DROP POLICY IF EXISTS "Profissionais podem atualizar seus dados" ON professionals;
DROP POLICY IF EXISTS "Admins podem gerenciar clientes" ON clients;
DROP POLICY IF EXISTS "Profissionais podem ver seus clientes" ON clients;
DROP POLICY IF EXISTS "Admins podem gerenciar serviços" ON services;
DROP POLICY IF EXISTS "Profissionais podem ver seus serviços" ON services;
DROP POLICY IF EXISTS "Serviços são visíveis publicamente" ON services;
DROP POLICY IF EXISTS "Admins podem gerenciar locais" ON service_locations;
DROP POLICY IF EXISTS "Profissionais podem ver locais ativos" ON service_locations;
DROP POLICY IF EXISTS "Locais ativos são visíveis publicamente" ON service_locations;
DROP POLICY IF EXISTS "Admins podem gerenciar agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem ver seus agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem atualizar seus agendamentos" ON appointments;
DROP POLICY IF EXISTS "Profissionais podem criar seus agendamentos" ON appointments;

-- =============================================================================
-- 5. POLÍTICAS PARA TABELA PROFESSIONALS
-- =============================================================================

-- Administradores podem fazer tudo
CREATE POLICY "Admins podem gerenciar profissionais"
ON professionals FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Profissionais podem ver apenas seus próprios dados
CREATE POLICY "Profissionais podem ver seus dados"
ON professionals FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND id = get_professional_id_by_user(auth.uid())
);

-- Profissionais podem atualizar apenas seus próprios dados
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

-- =============================================================================
-- 6. POLÍTICAS PARA TABELA CLIENTS
-- =============================================================================

-- Administradores podem gerenciar todos os clientes
CREATE POLICY "Admins podem gerenciar clientes"
ON clients FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Profissionais podem ver apenas clientes com agendamentos com eles
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

-- =============================================================================
-- 7. POLÍTICAS PARA TABELA SERVICES
-- =============================================================================

-- Administradores podem gerenciar todos os serviços
CREATE POLICY "Admins podem gerenciar serviços"
ON services FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Profissionais podem ver apenas serviços que eles oferecem
CREATE POLICY "Profissionais podem ver seus serviços"
ON services FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND get_professional_id_by_user(auth.uid())::TEXT = ANY(professional_ids)
);

-- Usuários anônimos podem ver serviços (para agendamento público)
CREATE POLICY "Serviços são visíveis publicamente"
ON services FOR SELECT
TO anon
USING (true);

-- =============================================================================
-- 8. POLÍTICAS PARA TABELA SERVICE_LOCATIONS
-- =============================================================================

-- Administradores podem gerenciar todos os locais
CREATE POLICY "Admins podem gerenciar locais"
ON service_locations FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Profissionais podem ver apenas locais ativos
CREATE POLICY "Profissionais podem ver locais ativos"
ON service_locations FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND is_active = true
);

-- Usuários anônimos podem ver locais ativos (para agendamento público)
CREATE POLICY "Locais ativos são visíveis publicamente"
ON service_locations FOR SELECT
TO anon
USING (is_active = true);

-- =============================================================================
-- 9. POLÍTICAS PARA TABELA APPOINTMENTS
-- =============================================================================

-- Administradores podem gerenciar todos os agendamentos
CREATE POLICY "Admins podem gerenciar agendamentos"
ON appointments FOR ALL
TO authenticated
USING (get_user_role(auth.uid()) = 'admin')
WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Profissionais podem ver apenas seus agendamentos
CREATE POLICY "Profissionais podem ver seus agendamentos"
ON appointments FOR SELECT
TO authenticated
USING (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
);

-- Profissionais podem atualizar apenas seus agendamentos
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

-- Profissionais podem criar agendamentos para si mesmos
CREATE POLICY "Profissionais podem criar seus agendamentos"
ON appointments FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role(auth.uid()) = 'professional' 
  AND professional_id = get_professional_id_by_user(auth.uid())
);

-- =============================================================================
-- 10. ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Índices para melhorar performance das consultas de segurança
CREATE INDEX IF NOT EXISTS idx_professionals_email ON professionals(email);
CREATE INDEX IF NOT EXISTS idx_appointments_professional_id ON appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_locations_active ON service_locations(is_active);

-- Índice GIN para arrays de professional_ids
CREATE INDEX IF NOT EXISTS idx_services_professional_ids ON services USING GIN(professional_ids);

-- =============================================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================================================

COMMENT ON FUNCTION get_user_role(UUID) IS 
'Função que determina o role do usuário baseado no email. Retorna admin ou professional.';

COMMENT ON FUNCTION get_professional_id_by_user(UUID) IS 
'Função que retorna o ID do profissional baseado no usuário autenticado.';

COMMENT ON POLICY "Admins podem gerenciar profissionais" ON professionals IS 
'Administradores têm acesso completo para gerenciar profissionais';

COMMENT ON POLICY "Profissionais podem ver seus dados" ON professionals IS 
'Profissionais podem visualizar apenas seus próprios dados';

COMMENT ON POLICY "Admins podem gerenciar agendamentos" ON appointments IS 
'Administradores podem gerenciar todos os agendamentos do sistema';

COMMENT ON POLICY "Profissionais podem ver seus agendamentos" ON appointments IS 
'Profissionais podem ver apenas agendamentos onde são o profissional responsável';

-- =============================================================================
-- 12. FUNÇÃO DE TESTE DE SEGURANÇA
-- =============================================================================

CREATE OR REPLACE FUNCTION test_security_policies()
RETURNS TABLE(
  table_name TEXT, 
  policy_count INTEGER,
  rls_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT as table_name,
    COALESCE(p.policy_count, 0)::INTEGER as policy_count,
    t.rowsecurity as rls_enabled
  FROM pg_tables t
  LEFT JOIN (
    SELECT 
      tablename,
      COUNT(*)::INTEGER as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  AND t.tablename IN ('professionals', 'clients', 'services', 'service_locations', 'appointments')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 13. VERIFICAÇÃO FINAL
-- =============================================================================

-- Executar teste de segurança
SELECT 
  table_name,
  policy_count,
  rls_enabled,
  CASE 
    WHEN rls_enabled AND policy_count > 0 THEN '✅ Seguro'
    WHEN NOT rls_enabled THEN '❌ RLS Desabilitado'
    WHEN policy_count = 0 THEN '⚠️ Sem Políticas'
    ELSE '❓ Status Desconhecido'
  END as status
FROM test_security_policies();