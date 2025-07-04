import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { NotificationService } from "@/lib/notification-service"

export async function POST(request: NextRequest) {
  try {
    const { campanhaId, forceSync } = await request.json()

    // Buscar campanha e token
    const { data: campanha, error: campanhaError } = await supabase
      .from("campanhas")
      .select(`
        *,
        contas_ads!inner(
          id,
          conta_id,
          tokens_meta!inner(
            access_token
          )
        )
      `)
      .eq("id", campanhaId)
      .single()

    if (campanhaError || !campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 })
    }

    const token = campanha.contas_ads.tokens_meta.access_token

    // Buscar insights diários da campanha do Meta
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - 30) // Últimos 30 dias

    const insightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${campanha.campanha_id}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm&time_range={"since":"${dataInicio.toISOString().split("T")[0]}","until":"${new Date().toISOString().split("T")[0]}"}&time_increment=1&access_token=${token}`,
    )

    const insightsData = await insightsResponse.json()

    if (insightsData.error) {
      return NextResponse.json({ error: insightsData.error.message }, { status: 400 })
    }

    // Processar e salvar métricas diárias
    const metricasParaSalvar = insightsData.data.map((insight: any) => ({
      campanha_id: campanhaId,
      data: insight.date_start,
      gasto_dia: Number.parseFloat(insight.spend || "0"),
      impressoes_dia: Number.parseInt(insight.impressions || "0"),
      cliques_dia: Number.parseInt(insight.clicks || "0"),
      leads_dia: Math.floor(Number.parseInt(insight.clicks || "0") * 0.05), // 5% conversão simulada
      ctr_dia: Number.parseFloat(insight.ctr || "0"),
      cpc_dia: Number.parseFloat(insight.cpc || "0"),
      cpm_dia: Number.parseFloat(insight.cpm || "0"),
    }))

    // Usar upsert para inserir ou atualizar
    const { error: upsertError } = await supabase.from("metricas_diarias").upsert(metricasParaSalvar, {
      onConflict: "campanha_id,data",
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    // Verificar se precisa gerar alertas
    await NotificationService.verificarPerformanceCampanhas()

    return NextResponse.json({
      success: true,
      metricas_sincronizadas: metricasParaSalvar.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
