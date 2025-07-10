-- Criar tabela de contas Google Analytics
CREATE TABLE IF NOT EXISTS contas_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  account_id VARCHAR(255) NOT NULL,
  property_id VARCHAR(255) NOT NULL,
  data_stream_id VARCHAR(255),
  nome_conta VARCHAR(255) NOT NULL,
  nome_propriedade VARCHAR(255) NOT NULL,
  url_site VARCHAR(500),
  status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'erro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tokens Google Analytics
CREATE TABLE IF NOT EXISTS tokens_google_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_analytics_id UUID REFERENCES contas_analytics(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de métricas do Google Analytics
CREATE TABLE IF NOT EXISTS metricas_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_analytics_id UUID REFERENCES contas_analytics(id) ON DELETE CASCADE,
  data_referencia DATE NOT NULL,
  sessoes INTEGER DEFAULT 0,
  usuarios INTEGER DEFAULT 0,
  novos_usuarios INTEGER DEFAULT 0,
  visualizacoes_pagina INTEGER DEFAULT 0,
  taxa_rejeicao DECIMAL(5,4) DEFAULT 0,
  duracao_sessao_media DECIMAL(10,2) DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  taxa_conversao DECIMAL(5,4) DEFAULT 0,
  receita DECIMAL(10,2) DEFAULT 0,
  origem_trafego JSONB,
  paginas_populares JSONB,
  dispositivos JSONB,
  localizacao JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de objetivos/conversões
CREATE TABLE IF NOT EXISTS objetivos_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_analytics_id UUID REFERENCES contas_analytics(id) ON DELETE CASCADE,
  objetivo_id VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_analytics_cliente_id ON contas_analytics(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tokens_google_analytics_conta_id ON tokens_google_analytics(conta_analytics_id);
CREATE INDEX IF NOT EXISTS idx_metricas_analytics_conta_id ON metricas_analytics(conta_analytics_id);
CREATE INDEX IF NOT EXISTS idx_metricas_analytics_data ON metricas_analytics(data_referencia);
CREATE INDEX IF NOT EXISTS idx_objetivos_analytics_conta_id ON objetivos_analytics(conta_analytics_id);

-- Criar constraint única para evitar duplicatas
ALTER TABLE contas_analytics ADD CONSTRAINT unique_cliente_property UNIQUE (cliente_id, property_id);
ALTER TABLE metricas_analytics ADD CONSTRAINT unique_conta_data UNIQUE (conta_analytics_id, data_referencia);

-- Habilitar RLS (Row Level Security)
ALTER TABLE contas_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens_google_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetivos_analytics ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para contas_analytics
CREATE POLICY "contas_analytics_policy" ON contas_analytics
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = contas_analytics.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = contas_analytics.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- Criar políticas RLS para tokens_google_analytics
CREATE POLICY "tokens_google_analytics_policy" ON tokens_google_analytics
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = tokens_google_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = tokens_google_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- Criar políticas RLS para metricas_analytics
CREATE POLICY "metricas_analytics_policy" ON metricas_analytics
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = metricas_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = metricas_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- Criar políticas RLS para objetivos_analytics
CREATE POLICY "objetivos_analytics_policy" ON objetivos_analytics
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = objetivos_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contas_analytics 
      JOIN clientes ON clientes.id = contas_analytics.cliente_id
      WHERE contas_analytics.id = objetivos_analytics.conta_analytics_id 
      AND clientes.usuario_id = auth.uid()
    )
  );