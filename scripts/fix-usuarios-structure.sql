-- Script DEFINITIVO para corrigir a estrutura da tabela usuarios
-- Execute este script no painel do Supabase (SQL Editor)
-- VERSÃO SIMPLIFICADA E DIRETA

-- 1. Verificar estrutura atual
SELECT 'Estrutura atual da tabela usuarios:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 2. FORÇAR remoção da coluna senha_hash
-- Primeiro, remover qualquer constraint NOT NULL
ALTER TABLE usuarios ALTER COLUMN senha_hash DROP NOT NULL;
-- Depois, remover a coluna completamente
ALTER TABLE usuarios DROP COLUMN senha_hash CASCADE;

-- 3. Adicionar coluna status
ALTER TABLE usuarios ADD COLUMN status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado'));

-- 4. Adicionar outras colunas necessárias
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS empresa VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Garantir constraints corretas
-- Garantir que email seja único
ALTER TABLE usuarios ADD CONSTRAINT usuarios_email_unique UNIQUE (email);

-- Garantir que nome seja NOT NULL
UPDATE usuarios SET nome = 'Usuário' WHERE nome IS NULL;
ALTER TABLE usuarios ALTER COLUMN nome SET NOT NULL;

-- Garantir que email seja NOT NULL
ALTER TABLE usuarios ALTER COLUMN email SET NOT NULL;

-- 6. Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_id ON usuarios(id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);

-- 7. DESABILITAR RLS para permitir inserções sem autenticação
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 8. Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 9. Verificar estrutura final
SELECT 'Estrutura FINAL da tabela usuarios:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 10. Verificar constraints
SELECT 'Constraints da tabela usuarios:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'usuarios'
ORDER BY tc.constraint_type, kcu.column_name;

-- 11. Verificar se RLS está desabilitado
SELECT 'Status RLS da tabela usuarios:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'usuarios';

SELECT 'Script DEFINITIVO de correção da tabela usuarios concluído!' as resultado;
SELECT 'A tabela usuarios está pronta para uso sem RLS.' as status;
SELECT 'Configure RLS posteriormente se necessário.' as observacao;