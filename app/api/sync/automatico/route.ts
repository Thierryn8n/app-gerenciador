import { type NextRequest, NextResponse } from "next/server"
import { SyncService } from "@/lib/sync-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Verificar se há configurações de sync ativas
    const { data: configuracoes, error } = await supabase
      .from("configuracoes_sync")
      .select("*")
      .eq("auto_sync_ativo", true)
      .eq("ativo", true)

    if (error) {
      throw error
    }

    const resultados = []

    // Executar sincronização para cada usuário configurado
    for (const config of configuracoes || []) {
      try {
        const agora = new Date()
        const proximaExecucao = config.proxima_execucao ? new Date(config.proxima_execucao) : null

        // Verificar se é hora de executar a sincronização
        if (!proximaExecucao || agora >= proximaExecucao) {
          const resultado = await SyncService.executarSincronizacaoAutomatica(config.usuario_id)
          resultados.push({
            usuario_id: config.usuario_id,
            resultado,
          })
        }
      } catch (error: any) {
        console.error(`Erro na sincronização do usuário ${config.usuario_id}:`, error)
        resultados.push({
          usuario_id: config.usuario_id,
          resultado: {
            success: false,
            erro: error.message,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização automática executada para ${resultados.length} usuários`,
      resultados,
    })
  } catch (error: any) {
    console.error("Erro na sincronização automática:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Endpoint de sincronização automática ativo",
    timestamp: new Date().toISOString(),
  })
}
