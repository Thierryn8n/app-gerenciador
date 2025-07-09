import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { contaAnalyticsId } = await request.json()

    // Buscar token da conta
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens_google_analytics")
      .select(`
        *,
        contas_analytics!inner(
          id,
          account_id,
          property_id,
          nome_conta,
          nome_propriedade
        )
      `)
      .eq("conta_analytics_id", contaAnalyticsId)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 404 })
    }

    // Verificar se o token ainda é válido
    if (tokenData.expires_at && new Date(tokenData.expires_at) <= new Date()) {
      // Token expirado, tentar renovar
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_ANALYTICS_CLIENT_ID!,
          client_secret: process.env.GOOGLE_ANALYTICS_CLIENT_SECRET!,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()
      
      if (refreshData.error) {
        return NextResponse.json({ error: "Erro ao renovar token" }, { status: 401 })
      }

      // Atualizar token no banco
      await supabase
        .from("tokens_google_analytics")
        .update({
          access_token: refreshData.access_token,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq("id", tokenData.id)

      tokenData.access_token = refreshData.access_token
    }

    const propertyId = tokenData.contas_analytics.property_id
    const accessToken = tokenData.access_token

    // Definir período (últimos 30 dias)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Buscar métricas do Google Analytics Data API (GA4)
    const metricsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{
            startDate: startDateStr,
            endDate: endDateStr
          }],
          dimensions: [
            { name: 'date' },
            { name: 'sessionDefaultChannelGroup' },
            { name: 'deviceCategory' },
            { name: 'country' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' },
            { name: 'totalRevenue' }
          ]
        })
      }
    )

    const metricsData = await metricsResponse.json()

    if (metricsData.error) {
      return NextResponse.json({ error: metricsData.error.message }, { status: 400 })
    }

    // Processar dados por data
    const dailyMetrics = new Map()
    
    if (metricsData.rows) {
      metricsData.rows.forEach((row: any) => {
        const date = row.dimensionValues[0].value
        const channel = row.dimensionValues[1].value
        const device = row.dimensionValues[2].value
        const country = row.dimensionValues[3].value
        
        const metrics = {
          sessions: parseInt(row.metricValues[0].value) || 0,
          users: parseInt(row.metricValues[1].value) || 0,
          newUsers: parseInt(row.metricValues[2].value) || 0,
          pageViews: parseInt(row.metricValues[3].value) || 0,
          bounceRate: parseFloat(row.metricValues[4].value) || 0,
          avgSessionDuration: parseFloat(row.metricValues[5].value) || 0,
          conversions: parseInt(row.metricValues[6].value) || 0,
          revenue: parseFloat(row.metricValues[7].value) || 0
        }

        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, {
            ...metrics,
            origemTrafego: {},
            dispositivos: {},
            localizacao: {}
          })
        } else {
          const existing = dailyMetrics.get(date)
          existing.sessions += metrics.sessions
          existing.users += metrics.users
          existing.newUsers += metrics.newUsers
          existing.pageViews += metrics.pageViews
          existing.conversions += metrics.conversions
          existing.revenue += metrics.revenue
        }

        const dayData = dailyMetrics.get(date)
        
        // Agrupar por origem de tráfego
        if (!dayData.origemTrafego[channel]) {
          dayData.origemTrafego[channel] = 0
        }
        dayData.origemTrafego[channel] += metrics.sessions

        // Agrupar por dispositivo
        if (!dayData.dispositivos[device]) {
          dayData.dispositivos[device] = 0
        }
        dayData.dispositivos[device] += metrics.sessions

        // Agrupar por localização
        if (!dayData.localizacao[country]) {
          dayData.localizacao[country] = 0
        }
        dayData.localizacao[country] += metrics.sessions
      })
    }

    // Salvar métricas no banco
    const metricsToInsert = []
    for (const [date, metrics] of dailyMetrics) {
      const taxaConversao = metrics.sessions > 0 ? (metrics.conversions / metrics.sessions) : 0
      
      metricsToInsert.push({
        conta_analytics_id: contaAnalyticsId,
        data_referencia: date,
        sessoes: metrics.sessions,
        usuarios: metrics.users,
        novos_usuarios: metrics.newUsers,
        visualizacoes_pagina: metrics.pageViews,
        taxa_rejeicao: metrics.bounceRate,
        duracao_sessao_media: metrics.avgSessionDuration,
        conversoes: metrics.conversions,
        taxa_conversao: taxaConversao,
        receita: metrics.revenue,
        origem_trafego: metrics.origemTrafego,
        dispositivos: metrics.dispositivos,
        localizacao: metrics.localizacao
      })
    }

    // Inserir ou atualizar métricas
    for (const metric of metricsToInsert) {
      await supabase
        .from("metricas_analytics")
        .upsert(metric, {
          onConflict: 'conta_analytics_id,data_referencia'
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sincronizadas ${metricsToInsert.length} métricas`,
      period: `${startDateStr} a ${endDateStr}`
    })

  } catch (error: any) {
    console.error("Erro na sincronização do Google Analytics:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}