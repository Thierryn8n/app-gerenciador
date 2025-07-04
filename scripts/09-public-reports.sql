-- Criar tabela para links públicos de relatórios
CREATE TABLE IF NOT EXISTS relatorios_publicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  gestor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  data_expiracao TIMESTAMP WITH TIME ZONE,
  visualizacoes INTEGER DEFAULT 0,
  ultima_visualizacao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_relatorios_publicos_token ON relatorios_publicos(token);
CREATE INDEX IF NOT EXISTS idx_relatorios_publicos_cliente ON relatorios_publicos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_publicos_gestor ON relatorios_publicos(gestor_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_publicos_ativo ON relatorios_publicos(ativo);

-- Função para gerar token único
CREATE OR REPLACE FUNCTION generate_unique_token()
RETURNS VARCHAR(64) AS $$
DECLARE
  new_token VARCHAR(64);
  token_exists BOOLEAN;
BEGIN
  LOOP
    new_token := encode(gen_random_bytes(32), 'hex');
    SELECT EXISTS(SELECT 1 FROM relatorios_publicos WHERE token = new_token) INTO token_exists;
    IF NOT token_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE relatorios_publicos ENABLE ROW LEVEL SECURITY;

-- Política para gestores verem apenas seus próprios relatórios
CREATE POLICY "Gestores podem ver seus relatórios públicos" ON relatorios_publicos
  FOR ALL USING (auth.uid() = gestor_id);

-- Política para acesso público via token (sem autenticação)
CREATE POLICY "Acesso público via token válido" ON relatorios_publicos
  FOR SELECT USING (ativo = true AND (data_expiracao IS NULL OR data_expiracao > NOW()));

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_relatorios_publicos_updated_at
  BEFORE UPDATE ON relatorios_publicos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
