import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export const runtime = 'edge'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { titulo, descricao, ativo, data_expiracao } = body

    const { data: relatorio, error } = await supabase
      .from("relatorios_publicos")
      .update({
        titulo,
        descricao,
        ativo,
        data_expiracao: data_expiracao || null,
      })
      .eq("id", params.id)
      .eq("gestor_id", user.id)
      .select(`
        *,
        clientes (
          nome,
          empresa
        )
      `)
      .single()

    if (error) {
      console.error("Erro ao atualizar relatório público:", error)
      return NextResponse.json({ error: "Erro ao atualizar relatório" }, { status: 500 })
    }

    return NextResponse.json({ relatorio })
  } catch (error) {
    console.error("Erro na API de relatórios públicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabase.from("relatorios_publicos").delete().eq("id", params.id).eq("gestor_id", user.id)

    if (error) {
      console.error("Erro ao deletar relatório público:", error)
      return NextResponse.json({ error: "Erro ao deletar relatório" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro na API de relatórios públicos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
