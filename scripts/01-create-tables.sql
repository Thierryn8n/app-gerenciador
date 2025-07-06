-- Criar tabela de usuários (gestores)
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

-- Criar tabela de clientes
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

-- Criar tabela de contas de anúncios
CREATE TABLE contas_ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
  plataforma VARCHAR(50) NOT NULL DEFAULT 'meta' CHECK (plataforma IN ('meta', 'google', 'tiktok')),
  conta_id VARCHAR(255) NOT NULL,
  nome_conta VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa', 'erro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tokens Meta
CREATE TABLE tokens_meta (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_ads_id UUID REFERENCES contas_ads(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'user_access_token',
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token TEXT,
  scopes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de campanhas
CREATE TABLE campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_ads_id UUID REFERENCES contas_ads(id) ON DELETE CASCADE,
  campanha_id VARCHAR(255) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  objetivo VARCHAR(100),
  valor_gasto DECIMAL(10,2) DEFAULT 0,
  alcance INTEGER DEFAULT 0,
  impressoes INTEGER DEFAULT 0,
  cliques INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_contas_ads_cliente_id ON contas_ads(cliente_id);
CREATE INDEX idx_tokens_meta_conta_ads_id ON tokens_meta(conta_ads_id);
CREATE INDEX idx_campanhas_conta_ads_id ON campanhas(conta_ads_id);
CREATE INDEX idx_campanhas_ultima_atualizacao ON campanhas(ultima_atualizacao);
