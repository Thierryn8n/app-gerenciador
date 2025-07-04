-- Primeiro, remover todas as políticas existentes se existirem
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar apenas seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Gestores podem ver apenas seus clientes" ON clientes;
DROP POLICY IF EXISTS "Gestores podem ver contas dos seus clientes" ON contas_ads;
DROP POLICY IF EXISTS "Gestores podem ver tokens das contas dos seus clientes" ON tokens_meta;
DROP POLICY IF EXISTS "Gestores podem ver campanhas das contas dos seus clientes" ON campanhas;

-- Habilitar RLS (Row Level Security)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários (CORRIGIDAS)
-- Permitir que qualquer usuário autenticado insira seu próprio registro
CREATE POLICY "usuarios_insert_policy" ON usuarios
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

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

-- Políticas para clientes
CREATE POLICY "clientes_policy" ON clientes
  FOR ALL 
  TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- Políticas para contas_ads
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

-- Políticas para tokens_meta
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

-- Políticas para campanhas
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

-- Garantir que a função auth.uid() está disponível
-- Criar função auxiliar se necessário
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;
