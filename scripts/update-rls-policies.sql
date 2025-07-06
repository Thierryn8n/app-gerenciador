-- Script para atualizar e corrigir todas as políticas RLS
-- Execute este script no painel do Supabase (SQL Editor)

-- ========================================
-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ========================================

-- Políticas da tabela usuarios
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios dados" ON usuarios;

-- Políticas da tabela clientes
DROP POLICY IF EXISTS "clientes_policy" ON clientes;
DROP POLICY IF EXISTS "Gestores podem ver apenas seus clientes" ON clientes;

-- Políticas da tabela contas_ads
DROP POLICY IF EXISTS "contas_ads_policy" ON contas_ads;
DROP POLICY IF EXISTS "Gestores podem ver contas dos seus clientes" ON contas_ads;

-- Políticas da tabela tokens_meta
DROP POLICY IF EXISTS "tokens_meta_policy" ON tokens_meta;
DROP POLICY IF EXISTS "Gestores podem ver tokens das contas dos seus clientes" ON tokens_meta;

-- Políticas da tabela campanhas
DROP POLICY IF EXISTS "campanhas_policy" ON campanhas;
DROP POLICY IF EXISTS "Gestores podem ver campanhas das contas dos seus clientes" ON campanhas;

-- Políticas da tabela notificacoes
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON notificacoes;

-- Políticas da tabela configuracoes_alertas
DROP POLICY IF EXISTS "Usuários podem ver suas configurações de alertas" ON configuracoes_alertas;

-- Políticas da tabela metricas_diarias
DROP POLICY IF EXISTS "Usuários podem ver métricas das campanhas dos seus clientes" ON metricas_diarias;

-- Políticas da tabela anotacoes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias anotações" ON anotacoes;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias anotações" ON anotacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias anotações" ON anotacoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias anotações" ON anotacoes;

-- Políticas da tabela tags_campanha
DROP POLICY IF EXISTS "Usuários podem ver suas próprias tags" ON tags_campanha;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias tags" ON tags_campanha;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias tags" ON tags_campanha;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias tags" ON tags_campanha;

-- Políticas da tabela campanhas_tags
DROP POLICY IF EXISTS "Usuários podem ver tags das suas campanhas" ON campanhas_tags;
DROP POLICY IF EXISTS "Usuários podem gerenciar tags das suas campanhas" ON campanhas_tags;

-- Políticas da tabela configuracoes_sync
DROP POLICY IF EXISTS "Usuários podem gerenciar suas configurações de sync" ON configuracoes_sync;

-- Políticas da tabela logs_sincronizacao
DROP POLICY IF EXISTS "Usuários podem ver seus logs de sincronização" ON logs_sincronizacao;

-- Políticas da tabela faturamento_clientes
DROP POLICY IF EXISTS "Usuários podem ver faturamento dos seus clientes" ON faturamento_clientes;

-- Políticas da tabela configuracoes_cobranca
DROP POLICY IF EXISTS "Usuários podem gerenciar configurações de cobrança dos seus clientes" ON configuracoes_cobranca;

-- Políticas da tabela relatorios_publicos
DROP POLICY IF EXISTS "Gestores podem ver seus relatórios públicos" ON relatorios_publicos;
DROP POLICY IF EXISTS "Acesso público via token válido" ON relatorios_publicos;

-- ========================================
-- 2. GARANTIR QUE A FUNÇÃO auth.uid() EXISTE
-- ========================================

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

-- ========================================
-- 3. HABILITAR RLS EM TODAS AS TABELAS
-- ========================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_campanha ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorios_publicos ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 4. CRIAR POLÍTICAS PARA TABELA USUARIOS
-- ========================================

-- Permitir inserção durante registro (sem autenticação prévia)
CREATE POLICY "usuarios_insert_policy" ON usuarios
  FOR INSERT 
  WITH CHECK (true); -- Permite inserção para qualquer um durante o registro

-- Permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "usuarios_select_policy" ON usuarios
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "usuarios_update_policy" ON usuarios
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir que usuários deletem apenas seus próprios dados
CREATE POLICY "usuarios_delete_policy" ON usuarios
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = id);

-- ========================================
-- 5. CRIAR POLÍTICAS PARA TABELA CLIENTES
-- ========================================

CREATE POLICY "clientes_policy" ON clientes
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ========================================
-- 6. CRIAR POLÍTICAS PARA TABELA CONTAS_ADS
-- ========================================

CREATE POLICY "contas_ads_policy" ON contas_ads
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = contas_ads.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = contas_ads.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 7. CRIAR POLÍTICAS PARA TABELA TOKENS_META
-- ========================================

CREATE POLICY "tokens_meta_policy" ON tokens_meta
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contas_ads 
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE contas_ads.id = tokens_meta.conta_ads_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_ads 
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE contas_ads.id = tokens_meta.conta_ads_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 8. CRIAR POLÍTICAS PARA TABELA CAMPANHAS
-- ========================================

CREATE POLICY "campanhas_policy" ON campanhas
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contas_ads 
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE contas_ads.id = campanhas.conta_ads_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_ads 
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE contas_ads.id = campanhas.conta_ads_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 9. CRIAR POLÍTICAS PARA TABELA NOTIFICACOES
-- ========================================

CREATE POLICY "notificacoes_policy" ON notificacoes
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ========================================
-- 10. CRIAR POLÍTICAS PARA TABELA CONFIGURACOES_ALERTAS
-- ========================================

CREATE POLICY "configuracoes_alertas_policy" ON configuracoes_alertas
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ========================================
-- 11. CRIAR POLÍTICAS PARA TABELA METRICAS_DIARIAS
-- ========================================

CREATE POLICY "metricas_diarias_policy" ON metricas_diarias
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campanhas 
      JOIN contas_ads ON contas_ads.id = campanhas.conta_ads_id
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE campanhas.id = metricas_diarias.campanha_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campanhas 
      JOIN contas_ads ON contas_ads.id = campanhas.conta_ads_id
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE campanhas.id = metricas_diarias.campanha_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 12. CRIAR POLÍTICAS PARA TABELA ANOTACOES
-- ========================================

CREATE POLICY "anotacoes_policy" ON anotacoes
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ========================================
-- 13. CRIAR POLÍTICAS PARA TABELA TAGS_CAMPANHA
-- ========================================

CREATE POLICY "tags_campanha_policy" ON tags_campanha
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- ========================================
-- 14. CRIAR POLÍTICAS PARA TABELA CAMPANHAS_TAGS
-- ========================================

CREATE POLICY "campanhas_tags_policy" ON campanhas_tags
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campanhas 
      JOIN contas_ads ON contas_ads.id = campanhas.conta_ads_id
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE campanhas.id = campanhas_tags.campanha_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campanhas 
      JOIN contas_ads ON contas_ads.id = campanhas.conta_ads_id
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE campanhas.id = campanhas_tags.campanha_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 15. CRIAR POLÍTICAS PARA TABELAS DE SYNC E BILLING
-- ========================================

-- Configurações de sincronização
CREATE POLICY "configuracoes_sync_policy" ON configuracoes_sync
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Logs de sincronização
CREATE POLICY "logs_sincronizacao_policy" ON logs_sincronizacao
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Faturamento de clientes
CREATE POLICY "faturamento_clientes_policy" ON faturamento_clientes
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = faturamento_clientes.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = faturamento_clientes.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- Configurações de cobrança
CREATE POLICY "configuracoes_cobranca_policy" ON configuracoes_cobranca
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = configuracoes_cobranca.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = configuracoes_cobranca.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- ========================================
-- 16. CRIAR POLÍTICAS PARA TABELA RELATORIOS_PUBLICOS
-- ========================================

-- Política para gestores verem apenas seus próprios relatórios
CREATE POLICY "relatorios_publicos_gestor_policy" ON relatorios_publicos
  FOR ALL 
  TO authenticated
  USING (gestor_id = auth.uid())
  WITH CHECK (gestor_id = auth.uid());

-- Política para acesso público via token (sem autenticação)
CREATE POLICY "relatorios_publicos_token_policy" ON relatorios_publicos
  FOR SELECT 
  TO anon
  USING (ativo = true AND (data_expiracao IS NULL OR data_expiracao > NOW()));

-- ========================================
-- 17. VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar se todas as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'usuarios', 'clientes', 'contas_ads', 'tokens_meta', 'campanhas',
    'notificacoes', 'configuracoes_alertas', 'metricas_diarias', 'anotacoes',
    'tags_campanha', 'campanhas_tags', 'configuracoes_sync', 'logs_sincronizacao',
    'faturamento_clientes', 'configuracoes_cobranca', 'relatorios_publicos'
)
ORDER BY tablename;

-- Mensagem de sucesso
SELECT 'Políticas RLS atualizadas com sucesso!' as status;