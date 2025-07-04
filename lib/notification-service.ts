import { supabase } from "./supabase"

interface AlertConfig {
  tipo: string
  limite_percentual?: number
  limite_valor?: number
}

export class NotificationService {
  static async verificarPerformanceCampanhas() {
    try {
      // Buscar todas as campanhas ativas
      const { data: campanhas, error } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner(
            clientes!inner(
              usuario_id
            )
          )
        `)
        .eq("status", "ACTIVE")

      if (error) throw error

      for (const campanha of campanhas || []) {
        await this.verificarCTRCampanha(campanha)
        await this.verificarOrcamentoCampanha(campanha)
        await this.verificarStatusCampanha(campanha)
      }
    } catch (error) {
      console.error("Erro ao verificar performance das campanhas:", error)
    }
  }

  static async verificarCTRCampanha(campanha: any) {
    try {
      // Buscar métricas dos últimos 7 dias
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - 7)

      const { data: metricas, error } = await supabase
        .from("metricas_diarias")
        .select("*")
        .eq("campanha_id", campanha.id)
        .gte("data", dataInicio.toISOString().split("T")[0])
        .order("data", { ascending: true })

      if (error || !metricas || metricas.length < 2) return

      // Calcular CTR médio dos primeiros 3 dias vs últimos 3 dias
      const primeiros3Dias = metricas.slice(0, 3)
      const ultimos3Dias = metricas.slice(-3)

      const ctrInicial = primeiros3Dias.reduce((sum, m) => sum + m.ctr_dia, 0) / primeiros3Dias.length
      const ctrRecente = ultimos3Dias.reduce((sum, m) => sum + m.ctr_dia, 0) / ultimos3Dias.length

      const quedaPercentual = ((ctrInicial - ctrRecente) / ctrInicial) * 100

      // Se queda > 30%, criar notificação
      if (quedaPercentual > 30) {
        await this.criarNotificacao({
          usuario_id: campanha.contas_ads.clientes.usuario_id,
          campanha_id: campanha.id,
          tipo: "performance",
          titulo: "Queda de Performance Detectada",
          mensagem: `A campanha "${campanha.nome}" teve uma queda de CTR de ${quedaPercentual.toFixed(1)}% nos últimos dias.`,
          severidade: "warning",
          dados_contexto: {
            ctr_inicial: ctrInicial,
            ctr_recente: ctrRecente,
            queda_percentual: quedaPercentual,
          },
        })
      }
    } catch (error) {
      console.error("Erro ao verificar CTR da campanha:", error)
    }
  }

  static async verificarOrcamentoCampanha(campanha: any) {
    try {
      // Verificar se gasto está acima de um limite (simulado)
      const limiteOrcamento = campanha.valor_gasto * 1.2 // 20% acima do gasto atual

      if (campanha.valor_gasto > limiteOrcamento) {
        await this.criarNotificacao({
          usuario_id: campanha.contas_ads.clientes.usuario_id,
          campanha_id: campanha.id,
          tipo: "orcamento",
          titulo: "Orçamento Excedido",
          mensagem: `A campanha "${campanha.nome}" excedeu o orçamento planejado.`,
          severidade: "error",
          dados_contexto: {
            gasto_atual: campanha.valor_gasto,
            limite_orcamento: limiteOrcamento,
          },
        })
      }
    } catch (error) {
      console.error("Erro ao verificar orçamento da campanha:", error)
    }
  }

  static async verificarStatusCampanha(campanha: any) {
    try {
      // Verificar se campanha foi pausada recentemente
      const ultimaAtualizacao = new Date(campanha.ultima_atualizacao)
      const agora = new Date()
      const diferencaHoras = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60)

      if (campanha.status === "PAUSED" && diferencaHoras < 1) {
        await this.criarNotificacao({
          usuario_id: campanha.contas_ads.clientes.usuario_id,
          campanha_id: campanha.id,
          tipo: "status",
          titulo: "Campanha Pausada",
          mensagem: `A campanha "${campanha.nome}" foi pausada.`,
          severidade: "info",
          dados_contexto: {
            status_anterior: "ACTIVE",
            status_atual: "PAUSED",
          },
        })
      }
    } catch (error) {
      console.error("Erro ao verificar status da campanha:", error)
    }
  }

  static async criarNotificacao(dados: {
    usuario_id: string
    campanha_id?: string
    tipo: string
    titulo: string
    mensagem: string
    severidade: "info" | "warning" | "error" | "success"
    dados_contexto?: any
  }) {
    try {
      // Verificar se já existe notificação similar recente
      const { data: existente, error: errorExistente } = await supabase
        .from("notificacoes")
        .select("id")
        .eq("usuario_id", dados.usuario_id)
        .eq("campanha_id", dados.campanha_id)
        .eq("tipo", dados.tipo)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
        .limit(1)

      if (errorExistente) throw errorExistente
      if (existente && existente.length > 0) return // Já existe notificação similar

      const { error } = await supabase.from("notificacoes").insert(dados)

      if (error) throw error
    } catch (error) {
      console.error("Erro ao criar notificação:", error)
    }
  }

  static async gerarNotificacoesTeste(usuarioId: string) {
    // Função para gerar notificações de teste
    const notificacoesTeste = [
      {
        usuario_id: usuarioId,
        tipo: "performance",
        titulo: "Queda de Performance",
        mensagem: "Campanha Black Friday teve queda de CTR de 35% nos últimos 3 dias.",
        severidade: "warning" as const,
      },
      {
        usuario_id: usuarioId,
        tipo: "orcamento",
        titulo: "Orçamento Excedido",
        mensagem: "Campanha Lançamento Produto excedeu o orçamento em 15%.",
        severidade: "error" as const,
      },
      {
        usuario_id: usuarioId,
        tipo: "status",
        titulo: "Campanha Pausada",
        mensagem: "Campanha Remarketing foi pausada automaticamente.",
        severidade: "info" as const,
      },
    ]

    for (const notificacao of notificacoesTeste) {
      await this.criarNotificacao(notificacao)
    }
  }
}
