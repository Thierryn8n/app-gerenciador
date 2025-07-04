import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Buscar relatório público pelo token
    const { data: relatorio, error: relatorioError } = await supabase
      .from("relatorios_publicos")
      .select(`
        *,
        clientes (
          id,
          nome,
          empresa,
          setor,
          created_at
        )
      `)
      .eq("token", params.token)
      .eq("ativo", true)
      .single()

    if (relatorioError || !relatorio) {
      return NextResponse.json({ error: "Relatório não encontrado ou inativo" }, { status: 404 })
    }

    // Verificar se não expirou
    if (relatorio.data_expiracao && new Date(relatorio.data_expiracao) < new Date()) {
      return NextResponse.json({ error: "Relatório expirado" }, { status: 410 })
    }

    // Buscar dados do gestor
    const { data: gestor, error: gestorError } = await supabase
      .from("profiles")
      .select("nome, empresa")
      .eq("id", relatorio.gestor_id)
      .single()

    // Buscar campanhas do cliente
    const { data: campanhas, error: campanhasError } = await supabase
      .from("campanhas")
      .select(`
        *,
        campanha_tags (
          tags (
            nome,
            cor
          )
        )
      `)
      .eq("cliente_id", relatorio.clientes.id)
      .eq("ativo", true)

    if (campanhasError) {
      console.error("Erro ao buscar campanhas:", campanhasError)
    }

    // Buscar métricas consolidadas
    const { data: metricas, error: metricasError } = await supabase
      .from("metricas_campanhas")
      .select("*")
      .in("campanha_id", campanhas?.map((c) => c.id) || [])
      .gte("data", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 dias

    if (metricasError) {
      console.error("Erro ao buscar métricas:", metricasError)
    }

    // Atualizar contador de visualizações
    await supabase
      .from("relatorios_publicos")
      .update({
        visualizacoes: relatorio.visualizacoes + 1,
        ultima_visualizacao: new Date().toISOString(),
      })
      .eq("id", relatorio.id)

    return NextResponse.json({
      relatorio: {
        ...relatorio,
        gestor: gestor || { nome: "Gestor", empresa: null },
      },
      cliente: relatorio.clientes,
      campanhas: campanhas || [],
      metricas: metricas || [],
    })
  } catch (error) {
    console.error("Erro na API de relatório público:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
