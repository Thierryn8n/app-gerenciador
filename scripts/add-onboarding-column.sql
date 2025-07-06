-- Adicionar coluna onboarding_completed na tabela usuarios
-- Execute este script no painel do Supabase (SQL Editor)

-- Adicionar a coluna se ela não existir
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Atualizar usuários existentes que já têm clientes para marcar onboarding como concluído
UPDATE usuarios 
SET onboarding_completed = TRUE 
WHERE id IN (
  SELECT DISTINCT usuario_id 
  FROM clientes 
  WHERE usuario_id IS NOT NULL
);

-- Verificar o resultado
SELECT 
  u.id,
  u.nome,
  u.email,
  u.onboarding_completed,
  COUNT(c.id) as total_clientes
FROM usuarios u
LEFT JOIN clientes c ON u.id = c.usuario_id
GROUP BY u.id, u.nome, u.email, u.onboarding_completed
ORDER BY u.created_at DESC;

SELECT 'Coluna onboarding_completed adicionada com sucesso!' as status;