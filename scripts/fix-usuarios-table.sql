-- Script para corrigir a tabela usuarios e resolver o problema de RLS
-- Execute este script no painel do Supabase (SQL Editor)

-- 1. Primeiro, desabilitar RLS temporariamente
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes
DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios;

-- 3. Fazer backup dos dados existentes (se houver)
CREATE TABLE usuarios_backup AS SELECT * FROM usuarios;

-- 4. Remover a tabela atual
DROP TABLE IF EXISTS usuarios CASCADE;

-- 5. Recriar a tabela com a estrutura correta
CREATE TABLE usuarios (
  id UUID PRIMARY KEY, -- ID do Supabase Auth
  email VARCHAR(255) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  telefone VARCHAR(20),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Recriar as tabelas dependentes
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  empresa VARCHAR(255),
  telefone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Recriar índices
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);

-- 8. Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 9. Recriar políticas RLS corrigidas
-- Política para inserção de usuários
CREATE POLICY "usuarios_insert_policy" ON usuarios
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para seleção de usuários
CREATE POLICY "usuarios_select_policy" ON usuarios
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Política para atualização de usuários
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

-- 10. Remover backup se tudo estiver funcionando
-- DROP TABLE usuarios_backup;

-- Comentário: Execute este script no painel do Supabase
-- Depois teste o registro de um novo usuário