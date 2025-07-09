import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dlpzubtissziephnesfq.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscHp1YnRpc3N6aWVwaG5lc2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NjA4ODksImV4cCI6MjA2NzIzNjg4OX0.dTsLzz7kBNCZctipSig3it5cnzmLm6zFse40Ul9MTOI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript para o banco de dados
export interface Usuario {
  id: string
  email: string
  nome: string
  empresa?: string
  telefone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  usuario_id: string
  nome: string
  email: string
  empresa?: string
  telefone?: string
  status: "ativo" | "inativo" | "pausado"
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface ContaAds {
  id: string
  cliente_id: string
  plataforma: "meta" | "google" | "tiktok"
  conta_id: string
  nome_conta: string
  status: "ativa" | "inativa" | "erro"
  created_at: string
  updated_at: string
}

export interface TokenMeta {
  id: string
  conta_ads_id: string
  access_token: string
  token_type: string
  expires_at?: string
  refresh_token?: string
  scopes?: string[]
  created_at: string
  updated_at: string
}

export interface Campanha {
  id: string
  conta_ads_id: string
  campanha_id: string
  nome: string
  status: string
  objetivo?: string
  tipo?: "trafego" | "conversao" | "reconhecimento" | "engajamento"
  valor_gasto: number
  alcance: number
  impressoes: number
  cliques: number
  ctr: number
  palavras_chave?: string[]
  data_inicio?: string
  data_fim?: string
  ultima_atualizacao: string
  created_at: string
  contas_ads?: ContaAds & {
    clientes: Cliente
  }
  tags?: TagCampanha[]
}

export interface TagCampanha {
  id: string
  usuario_id: string
  nome: string
  cor: string
  descricao?: string
  created_at: string
  updated_at: string
}

export interface CampanhaTag {
  id: string
  campanha_id: string
  tag_id: string
  created_at: string
  tag?: TagCampanha
}

export interface Notificacao {
  id: string
  usuario_id: string
  campanha_id?: string
  tipo: string
  titulo: string
  mensagem: string
  severidade: "info" | "warning" | "error" | "success"
  lida: boolean
  ativa: boolean
  dados_contexto?: any
  created_at: string
  updated_at: string
}

export interface ConfiguracaoAlerta {
  id: string
  usuario_id: string
  cliente_id?: string
  campanha_id?: string
  tipo_alerta: string
  ativo: boolean
  limite_valor?: number
  limite_percentual?: number
  configuracoes?: any
  created_at: string
  updated_at: string
}

export interface MetricaDiaria {
  id: string
  campanha_id: string
  data: string
  gasto_dia: number
  impressoes_dia: number
  cliques_dia: number
  leads_dia: number
  ctr_dia: number
  cpc_dia: number
  cpm_dia: number
  created_at: string
}

export interface Anotacao {
  id: string
  usuario_id: string
  cliente_id?: string
  campanha_id?: string
  titulo?: string
  conteudo: string
  cor: string
  created_at: string
  updated_at: string
}

export interface ConfiguracaoSync {
  id: string
  usuario_id: string
  ativo: boolean
  horario_sync: string
  intervalo_horas: number
  auto_sync_ativo: boolean
  ultima_execucao?: string
  proxima_execucao?: string
  created_at: string
  updated_at: string
}

export interface LogSincronizacao {
  id: string
  usuario_id: string
  cliente_id: string
  conta_ads_id: string
  status: "sucesso" | "erro" | "em_andamento"
  tipo_sync: "manual" | "automatico" | "agendado"
  campanhas_sincronizadas: number
  metricas_sincronizadas: number
  tempo_execucao_ms?: number
  mensagem_erro?: string
  dados_contexto?: any
  created_at: string
}

export interface FaturamentoCliente {
  id: string
  cliente_id: string
  mes_referencia: string
  valor_mensal: number
  status_pagamento: "pago" | "pendente" | "atrasado" | "cancelado"
  data_vencimento: string
  data_pagamento?: string
  observacoes?: string
  metodo_pagamento?: string
  numero_fatura?: string
  created_at: string
  updated_at: string
}

export interface ConfiguracaoCobranca {
  id: string
  cliente_id: string
  valor_mensal: number
  dia_vencimento: number
  ativo: boolean
  observacoes?: string
  created_at: string
  updated_at: string
}

// Interfaces para Google Analytics
export interface ContaAnalytics {
  id: string
  cliente_id: string
  account_id: string
  property_id: string
  data_stream_id?: string
  nome_conta: string
  nome_propriedade: string
  url_site?: string
  status: "ativa" | "inativa" | "erro"
  created_at: string
  updated_at: string
}

export interface TokenGoogleAnalytics {
  id: string
  conta_analytics_id: string
  access_token: string
  refresh_token: string
  token_type: string
  expires_at?: string
  scope?: string
  created_at: string
  updated_at: string
}

export interface MetricaAnalytics {
  id: string
  conta_analytics_id: string
  data_referencia: string
  sessoes: number
  usuarios: number
  novos_usuarios: number
  visualizacoes_pagina: number
  taxa_rejeicao: number
  duracao_sessao_media: number
  conversoes: number
  taxa_conversao: number
  receita: number
  origem_trafego?: any
  paginas_populares?: any
  dispositivos?: any
  localizacao?: any
  created_at: string
  updated_at: string
}

export interface ObjetivoAnalytics {
  id: string
  conta_analytics_id: string
  objetivo_id: string
  nome: string
  tipo: string
  valor?: number
  ativo: boolean
  created_at: string
  updated_at: string
}
