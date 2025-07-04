-- Criar tabela de notificações
CREATE TABLE notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('performance', 'orcamento', 'status', 'sistema')),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  severidade VARCHAR(20) DEFAULT 'info' CHECK (severidade IN ('info', 'warning', 'error', 'success')),
  lida BOOLEAN DEFAULT FALSE,
  ativa BOOLEAN DEFAULT TRUE,
  dados_contexto JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de configurações de alertas
CREATE TABLE configuracoes_alertas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR(50) NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  limite_valor DECIMAL(10,2),
  limite_percentual DECIMAL(5,2),
  configuracoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de métricas diárias
CREATE TABLE metricas_diarias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  gasto_dia DECIMAL(10,2) DEFAULT 0,
  impressoes_dia INTEGER DEFAULT 0,
  cliques_dia INTEGER DEFAULT 0,
  leads_dia INTEGER DEFAULT 0,
  ctr_dia DECIMAL(5,4) DEFAULT 0,
  cpc_dia DECIMAL(10,2) DEFAULT 0,
  cpm_dia DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campanha_id, data)
);

-- Criar índices
CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_campanha_id ON notificacoes(campanha_id);
CREATE INDEX idx_notificacoes_created_at ON notificacoes(created_at);
CREATE INDEX idx_configuracoes_alertas_usuario_id ON configuracoes_alertas(usuario_id);
CREATE INDEX idx_metricas_diarias_campanha_data ON metricas_diarias(campanha_id, data);

-- Políticas RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas notificações" ON notificacoes
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem ver suas configurações de alertas" ON configuracoes_alertas
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem ver métricas das campanhas dos seus clientes" ON metricas_diarias
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM campanhas 
      JOIN contas_ads ON contas_ads.id = campanhas.conta_ads_id
      JOIN clientes ON clientes.id = contas_ads.cliente_id
      WHERE campanhas.id = metricas_diarias.campanha_id 
      AND clientes.usuario_id = auth.uid()
    )
  );
