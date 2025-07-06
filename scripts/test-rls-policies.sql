-- Script para testar as políticas RLS após a correção
-- Execute este script no painel do Supabase para verificar se tudo está funcionando

-- 1. Verificar se a tabela usuarios existe e tem a estrutura correta
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'usuarios' 
ORDER BY ordinal_position;

-- 2. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('usuarios', 'clientes')
AND schemaname = 'public';

-- 3. Listar todas as políticas RLS ativas
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
WHERE tablename IN ('usuarios', 'clientes')
ORDER BY tablename, policyname;

-- 4. Verificar se a função auth.uid() está disponível
SELECT 
    routine_name,
    routine_type,
    routine_schema
FROM information_schema.routines 
WHERE routine_schema = 'auth' 
AND routine_name = 'uid';

-- 5. Testar se conseguimos acessar a função auth.uid() (deve retornar NULL se não autenticado)
SELECT auth.uid() as current_user_id;

-- 6. Verificar se existem usuários na tabela
SELECT COUNT(*) as total_usuarios FROM usuarios;

-- 7. Verificar constraints da tabela usuarios
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'usuarios'
AND constraint_type IN ('PRIMARY KEY', 'UNIQUE', 'CHECK');

-- Comentários sobre os resultados esperados:
-- - A tabela usuarios deve ter as colunas: id (UUID), email, nome, empresa, telefone, avatar_url, status, created_at, updated_at
-- - RLS deve estar habilitado (rowsecurity = true)
-- - Deve haver 3 políticas para usuarios: insert, select, update
-- - A função auth.uid() deve existir no schema auth
-- - Se não houver usuários autenticados, auth.uid() retorna NULL