-- Criar tabela de configurações de sincronização
CREATE TABLE IF NOT EXISTS configuracoes_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  horario_sync TIME DEFAULT '07:00:00',
  intervalo_horas INTEGER DEFAULT 24,
  auto_sync_ativo BOOLEAN DEFAULT true,
  ultima_execucao TIMESTAMP WITH TIME ZONE,
  proxima_execucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  conta_ads_id UUID REFERENCES contas_ads(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('sucesso', 'erro', 'em_andamento')),
  tipo_sync VARCHAR(50) NOT NULL CHECK (tipo_sync IN ('manual', 'automatico', 'agendado')),
  campanhas_sincronizadas INTEGER DEFAULT 0,
  metricas_sincronizadas INTEGER DEFAULT 0,
  tempo_execucao_ms INTEGER,
  mensagem_erro TEXT,
  dados_contexto JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de cobrança/faturamento
CREATE TABLE IF NOT EXISTS faturamento_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL, -- Primeiro dia do mês
  valor_mensal DECIMAL(10,2) NOT NULL,
  status_pagamento VARCHAR(50) DEFAULT 'pendente' CHECK (status_pagamento IN ('pago', 'pendente', 'atrasado', 'cancelado')),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  observacoes TEXT,
  metodo_pagamento VARCHAR(100),
  numero_fatura VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, mes_referencia)
);

-- Criar tabela de configurações de cobrança por cliente
CREATE TABLE IF NOT EXISTS configuracoes_cobranca (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  valor_mensal DECIMAL(10,2) NOT NULL,
  dia_vencimento INTEGER DEFAULT 5 CHECK (dia_vencimento BETWEEN 1 AND 28),
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_usuario_id ON logs_sincronizacao(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_sincronizacao_created_at ON logs_sincronizacao(created_at);
CREATE INDEX IF NOT EXISTS idx_faturamento_clientes_cliente_id ON faturamento_clientes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_faturamento_clientes_mes_referencia ON faturamento_clientes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_faturamento_clientes_status ON faturamento_clientes(status_pagamento);

-- Habilitar RLS
ALTER TABLE configuracoes_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sincronizacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturamento_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_cobranca ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem gerenciar suas configurações de sync" ON configuracoes_sync
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem ver seus logs de sincronização" ON logs_sincronizacao
  FOR ALL USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem gerenciar faturamento dos seus clientes" ON faturamento_clientes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = faturamento_clientes.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem gerenciar configurações de cobrança dos seus clientes" ON configuracoes_cobranca
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clientes 
      WHERE clientes.id = configuracoes_cobranca.cliente_id 
      AND clientes.usuario_id = auth.uid()
    )
  );

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_configuracoes_sync_updated_at BEFORE UPDATE ON configuracoes_sync FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faturamento_clientes_updated_at BEFORE UPDATE ON faturamento_clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_cobranca_updated_at BEFORE UPDATE ON configuracoes_cobranca FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
