import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { contaAdsId } = await request.json()

    // Buscar token da conta
    const { data: tokenData, error: tokenError } = await supabase
      .from("tokens_meta")
      .select("access_token, conta_ads_id")
      .eq("conta_ads_id", contaAdsId)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: "Token não encontrado" }, { status: 404 })
    }

    // Buscar informações da conta
    const { data: contaAds, error: contaError } = await supabase
      .from("contas_ads")
      .select("conta_id")
      .eq("id", contaAdsId)
      .single()

    if (contaError || !contaAds) {
      return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 })
    }

    // Buscar campanhas do Meta Ads
    const campanhasResponse = await fetch(
      `https://graph.facebook.com/v18.0/${contaAds.conta_id}/campaigns?fields=id,name,status,objective,insights{spend,reach,impressions,clicks,ctr}&access_token=${tokenData.access_token}`,
    )

    const campanhasData = await campanhasResponse.json()

    if (campanhasData.error) {
      return NextResponse.json({ error: campanhasData.error.message }, { status: 400 })
    }

    // Salvar/atualizar campanhas no banco
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

    // Usar upsert para inserir ou atualizar
    const { error: upsertError } = await supabase.from("campanhas").upsert(campanhasParaSalvar, {
      onConflict: "campanha_id,conta_ads_id",
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      campanhas: campanhasParaSalvar.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
