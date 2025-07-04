-- Criar tabela de anotações
CREATE TABLE IF NOT EXISTS anotacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
    titulo VARCHAR(255),
    conteudo TEXT NOT NULL,
    cor VARCHAR(20) DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir que pelo menos um dos IDs seja fornecido
    CONSTRAINT check_target CHECK (cliente_id IS NOT NULL OR campanha_id IS NOT NULL)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_anotacoes_usuario_id ON anotacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_cliente_id ON anotacoes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_anotacoes_campanha_id ON anotacoes(campanha_id);

-- RLS (Row Level Security)
ALTER TABLE anotacoes ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias anotações
CREATE POLICY "Usuários podem ver suas próprias anotações" ON anotacoes
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias anotações" ON anotacoes
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias anotações" ON anotacoes
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias anotações" ON anotacoes
    FOR DELETE USING (auth.uid() = usuario_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_anotacoes_updated_at BEFORE UPDATE ON anotacoes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
