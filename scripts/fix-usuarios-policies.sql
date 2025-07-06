-- Script para corrigir políticas RLS da tabela usuarios
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Remover políticas existentes da tabela usuarios
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON usuarios;

-- 2. Garantir que RLS está habilitado na tabela usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 3. Criar função auxiliar se não existir
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;

-- 4. Criar políticas para a tabela usuarios

-- Política para INSERT: Permitir que usuários autenticados insiram seus próprios dados
CREATE POLICY "usuarios_insert_policy" ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para SELECT: Permitir que usuários vejam seus próprios dados
CREATE POLICY "usuarios_select_policy" ON usuarios
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para UPDATE: Permitir que usuários atualizem seus próprios dados
CREATE POLICY "usuarios_update_policy" ON usuarios
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Verificar se a estrutura da tabela está correta
-- A tabela deve ter a coluna 'id' como UUID e chave primária
ALTER TABLE usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 6. Garantir que a coluna status tenha um valor padrão
ALTER TABLE usuarios ALTER COLUMN status SET DEFAULT 'ativo';

-- 7. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usuarios';

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'usuarios';