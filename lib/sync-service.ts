import { supabase } from "./supabase"

export interface SyncResult {
  success: boolean
  campanhasSincronizadas: number
  metricasSincronizadas: number
  tempoExecucao: number
  erro?: string
}

export class SyncService {
  static async executarSincronizacaoAutomatica(usuarioId: string): Promise<SyncResult> {
    const inicioExecucao = Date.now()
    let campanhasSincronizadas = 0
    let metricasSincronizadas = 0

    try {
      // Buscar todos os clientes do usuário com contas conectadas
      const { data: clientes, error: clientesError } = await supabase
        .from("clientes")
        .select(`
          id,
          nome,
          contas_ads!inner(
            id,
            conta_id,
            tokens_meta!inner(
              access_token
            )
          )
        `)
        .eq("usuario_id", usuarioId)
        .eq("status", "ativo")

      if (clientesError) throw clientesError

      // Sincronizar cada cliente
      for (const cliente of clientes || []) {
        for (const conta of cliente.contas_ads) {
          try {
            const resultadoConta = await this.sincronizarContaAds(
              usuarioId,
              cliente.id,
              conta.id,
              conta.conta_id,
              conta.tokens_meta.access_token,
            )

            campanhasSincronizadas += resultadoConta.campanhas
            metricasSincronizadas += resultadoConta.metricas

            // Log de sucesso por conta
            await this.criarLogSincronizacao({
              usuario_id: usuarioId,
              cliente_id: cliente.id,
              conta_ads_id: conta.id,
              status: "sucesso",
              tipo_sync: "automatico",
              campanhas_sincronizadas: resultadoConta.campanhas,
              metricas_sincronizadas: resultadoConta.metricas,
              tempo_execucao_ms: Date.now() - inicioExecucao,
            })
          } catch (error: any) {
            // Log de erro por conta
            await this.criarLogSincronizacao({
              usuario_id: usuarioId,
              cliente_id: cliente.id,
              conta_ads_id: conta.id,
              status: "erro",
              tipo_sync: "automatico",
              mensagem_erro: error.message,
              tempo_execucao_ms: Date.now() - inicioExecucao,
            })
          }
        }
      }

      // Atualizar configuração de sync
      await this.atualizarProximaExecucao(usuarioId)

      return {
        success: true,
        campanhasSincronizadas,
        metricasSincronizadas,
        tempoExecucao: Date.now() - inicioExecucao,
      }
    } catch (error: any) {
      return {
        success: false,
        campanhasSincronizadas,
        metricasSincronizadas,
        tempoExecucao: Date.now() - inicioExecucao,
        erro: error.message,
      }
    }
  }

  static async sincronizarContaAds(
    usuarioId: string,
    clienteId: string,
    contaAdsId: string,
    contaId: string,
    accessToken: string,
  ): Promise<{ campanhas: number; metricas: number }> {
    // Buscar campanhas do Meta Ads
    const campanhasResponse = await fetch(
      `https://graph.facebook.com/v18.0/${contaId}/campaigns?fields=id,name,status,objective,insights{spend,reach,impressions,clicks,ctr}&access_token=${accessToken}`,
    )

    const campanhasData = await campanhasResponse.json()

    if (campanhasData.error) {
      throw new Error(campanhasData.error.message)
    }

    // Salvar/atualizar campanhas
    const campanhasParaSalvar = campanhasData.data.map((campanha: any) => {
      const insights = campanha.insights?.data?.[0] || {}

      return {
        conta_ads_id: contaAdsId,
        campanha_id: campanha.id,
        nome: campanha.name,
        status: campanha.status,
        objetivo: campanha.objective,
        valor_gasto: Number.parseFloat(insights.spend || "0"),
        alcance: Number.parseInt(insights.reach || "0"),
        impressoes: Number.parseInt(insights.impressions || "0"),
        cliques: Number.parseInt(insights.clicks || "0"),
        ctr: Number.parseFloat(insights.ctr || "0"),
        ultima_atualizacao: new Date().toISOString(),
      }
    })

    const { error: upsertError } = await supabase.from("campanhas").upsert(campanhasParaSalvar, {
      onConflict: "campanha_id,conta_ads_id",
    })

    if (upsertError) throw upsertError

    // Sincronizar métricas diárias para cada campanha
    let totalMetricas = 0
    for (const campanha of campanhasParaSalvar) {
      try {
        const metricas = await this.sincronizarMetricasDiarias(campanha.campanha_id, accessToken)
        totalMetricas += metricas
      } catch (error) {
        console.error(`Erro ao sincronizar métricas da campanha ${campanha.campanha_id}:`, error)
      }
    }

    return {
      campanhas: campanhasParaSalvar.length,
      metricas: totalMetricas,
    }
  }

  static async sincronizarMetricasDiarias(campanhaId: string, accessToken: string): Promise<number> {
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 7) // Últimos 7 dias

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${campanhaId}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm&time_range={"since":"${dataInicio.toISOString().split("T")[0]}","until":"${new Date().toISOString().split("T")[0]}"}&time_increment=1&access_token=${accessToken}`,
    )

    const insightsData = await insightsResponse.json()

    if (insightsData.error) {
      throw new Error(insightsData.error.message)
    }

    const metricasParaSalvar = insightsData.data.map((insight: any) => ({
      campanha_id: campanhaId,
      data: insight.date_start,
      gasto_dia: Number.parseFloat(insight.spend || "0"),
      impressoes_dia: Number.parseInt(insight.impressions || "0"),
      cliques_dia: Number.parseInt(insight.clicks || "0"),
      leads_dia: Math.floor(Number.parseInt(insight.clicks || "0") * 0.05),
      ctr_dia: Number.parseFloat(insight.ctr || "0"),
      cpc_dia: Number.parseFloat(insight.cpc || "0"),
      cpm_dia: Number.parseFloat(insight.cpm || "0"),
    }))

    const { error } = await supabase.from("metricas_diarias").upsert(metricasParaSalvar, {
      onConflict: "campanha_id,data",
    })

    if (error) throw error

    return metricasParaSalvar.length
  }

  static async criarLogSincronizacao(dados: {
    usuario_id: string
    cliente_id: string
    conta_ads_id: string
    status: "sucesso" | "erro" | "em_andamento"
    tipo_sync: "manual" | "automatico" | "agendado"
    campanhas_sincronizadas?: number
    metricas_sincronizadas?: number
    tempo_execucao_ms?: number
    mensagem_erro?: string
    dados_contexto?: any
  }) {
    const { error } = await supabase.from("logs_sincronizacao").insert(dados)
    if (error) {
      console.error("Erro ao criar log de sincronização:", error)
    }
  }

  static async atualizarProximaExecucao(usuarioId: string) {
    const { data: config, error } = await supabase
      .from("configuracoes_sync")
      .select("*")
      .eq("usuario_id", usuarioId)
      .single()

    if (error || !config) return

    const agora = new Date()
    const proximaExecucao = new Date(agora)
    proximaExecucao.setDate(proximaExecucao.getDate() + 1)

    // Definir horário baseado na configuração
    const [horas, minutos] = config.horario_sync.split(":")
    proximaExecucao.setHours(Number.parseInt(horas), Number.parseInt(minutos), 0, 0)

    await supabase
      .from("configuracoes_sync")
      .update({
        ultima_execucao: agora.toISOString(),
        proxima_execucao: proximaExecucao.toISOString(),
      })
      .eq("usuario_id", usuarioId)
  }

  static async obterStatusSincronizacao(usuarioId: string) {
    const { data: config } = await supabase.from("configuracoes_sync").select("*").eq("usuario_id", usuarioId).single()

    const { data: ultimoLog } = await supabase
      .from("logs_sincronizacao")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    return {
      configuracao: config,
      ultimoLog: ultimoLog,
    }
  }
}
