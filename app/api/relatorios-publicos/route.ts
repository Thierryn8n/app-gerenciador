import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: relatorios, error } = await supabase
      .from("relatorios_publicos")
      .select(`
        *,
        clientes (
          nome,
          empresa
        )
      `)
      .eq("gestor_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar relatórios públicos:", error)
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }

    return NextResponse.json({ relatorios })
  } catch (error) {
    console.error("Erro na API de relatórios públicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { cliente_id, titulo, descricao, data_expiracao } = body

    // Gerar token único
    const { data: tokenData, error: tokenError } = await supabase.rpc("generate_unique_token")

    if (tokenError) {
      console.error("Erro ao gerar token:", tokenError)
      return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 })
    }

    const { data: relatorio, error } = await supabase
      .from("relatorios_publicos")
      .insert({
        cliente_id,
        gestor_id: user.id,
        token: tokenData,
        titulo,
        descricao,
        data_expiracao: data_expiracao || null,
      })
      .select(`
        *,
        clientes (
          nome,
          empresa
        )
      `)
      .single()

    if (error) {
      console.error("Erro ao criar relatório público:", error)
      return NextResponse.json({ error: "Erro ao criar relatório" }, { status: 500 })
    }

    return NextResponse.json({ relatorio })
  } catch (error) {
    console.error("Erro na API de relatórios públicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
