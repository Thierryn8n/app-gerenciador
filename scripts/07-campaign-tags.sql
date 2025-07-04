-- Criar tabela de tags para campanhas
CREATE TABLE IF NOT EXISTS tags_campanha (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, nome)
);

-- Criar tabela de relacionamento campanhas-tags
CREATE TABLE IF NOT EXISTS campanhas_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags_campanha(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campanha_id, tag_id)
);

-- Adicionar colunas à tabela campanhas para suporte a tags
ALTER TABLE campanhas 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'trafego',
ADD COLUMN IF NOT EXISTS palavras_chave TEXT[];

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_tags_campanha_usuario ON tags_campanha(usuario_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_tags_campanha ON campanhas_tags(campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_tags_tag ON campanhas_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_tipo ON campanhas(tipo);

-- RLS Policies para tags_campanha
ALTER TABLE tags_campanha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias tags" ON tags_campanha
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar suas próprias tags" ON tags_campanha
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias tags" ON tags_campanha
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias tags" ON tags_campanha
  FOR DELETE USING (auth.uid() = usuario_id);

-- RLS Policies para campanhas_tags
ALTER TABLE campanhas_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver tags de suas campanhas" ON campanhas_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campanhas c
      JOIN contas_ads ca ON c.conta_ads_id = ca.id
      JOIN clientes cl ON ca.cliente_id = cl.id
      WHERE c.id = campanhas_tags.campanha_id
      AND cl.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem adicionar tags às suas campanhas" ON campanhas_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campanhas c
      JOIN contas_ads ca ON c.conta_ads_id = ca.id
      JOIN clientes cl ON ca.cliente_id = cl.id
      WHERE c.id = campanhas_tags.campanha_id
      AND cl.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem remover tags de suas campanhas" ON campanhas_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM campanhas c
      JOIN contas_ads ca ON c.conta_ads_id = ca.id
      JOIN clientes cl ON ca.cliente_id = cl.id
      WHERE c.id = campanhas_tags.campanha_id
      AND cl.usuario_id = auth.uid()
    )
  );

-- Inserir algumas tags padrão
INSERT INTO tags_campanha (usuario_id, nome, cor, descricao) 
SELECT 
  auth.uid(),
  unnest(ARRAY['Black Friday', 'Institucional', 'Conversão', 'Tráfego', 'Engajamento', 'Retargeting']),
  unnest(ARRAY['#DC2626', '#059669', '#7C3AED', '#2563EB', '#EA580C', '#DB2777']),
  unnest(ARRAY[
    'Campanhas para Black Friday e promoções especiais',
    'Campanhas institucionais e branding',
    'Campanhas focadas em conversões e vendas',
    'Campanhas para geração de tráfego',
    'Campanhas para engajamento e interação',
    'Campanhas de retargeting e remarketing'
  ])
ON CONFLICT (usuario_id, nome) DO NOTHING;
