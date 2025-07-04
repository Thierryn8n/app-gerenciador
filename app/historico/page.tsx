"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Cliente, type Campanha } from "@/lib/supabase"
import { Calendar, DollarSign, Eye, MousePointer, Target, BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react"

interface HistoricoData {
  periodo_atual: {
    gasto_total: number
    impressoes: number
    cliques: number
    conversoes: number
    campanhas: Campanha[]
  }
  periodo_anterior: {
    gasto_total: number
    impressoes: number
    cliques: number
    conversoes: number
  }
  variacao: {
    gasto: number
    impressoes: number
    cliques: number
    conversoes: number
  }
}

export default function HistoricoPage() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState("")
  const [periodo, setPeriodo] = useState("7")
  const [historico, setHistorico] = useState<HistoricoData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario) {
      fetchClientes()
    }
  }, [usuario])

  useEffect(() => {
    if (clienteSelecionado && periodo) {
      fetchHistorico()
    }
  }, [clienteSelecionado, periodo])

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .eq("status", "ativo")

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    }
  }

  const fetchHistorico = async () => {
    setLoading(true)
    try {
      const diasPeriodo = Number.parseInt(periodo)
      const dataFimAtual = new Date()
      const dataInicioAtual = new Date()
      dataInicioAtual.setDate(dataInicioAtual.getDate() - diasPeriodo)

      const dataFimAnterior = new Date(dataInicioAtual)
      const dataInicioAnterior = new Date(dataInicioAtual)
      dataInicioAnterior.setDate(dataInicioAnterior.getDate() - diasPeriodo)

      // Buscar dados do período atual
      const { data: campanhasAtual, error: errorAtual } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner(
            cliente_id
          )
        `)
        .eq("contas_ads.cliente_id", clienteSelecionado)
        .gte("ultima_atualizacao", dataInicioAtual.toISOString())
        .lte("ultima_atualizacao", dataFimAtual.toISOString())

      if (errorAtual) throw errorAtual

      // Buscar dados do período anterior
      const { data: campanhasAnterior, error: errorAnterior } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner(
            cliente_id
          )
        `)
        .eq("contas_ads.cliente_id", clienteSelecionado)
        .gte("ultima_atualizacao", dataInicioAnterior.toISOString())
        .lte("ultima_atualizacao", dataFimAnterior.toISOString())

      if (errorAnterior) throw errorAnterior

      // Calcular métricas do período atual
      const gastoAtual = campanhasAtual?.reduce((sum, c) => sum + c.valor_gasto, 0) || 0
      const impressoesAtual = campanhasAtual?.reduce((sum, c) => sum + c.impressoes, 0) || 0
      const cliquesAtual = campanhasAtual?.reduce((sum, c) => sum + c.cliques, 0) || 0
      const conversoesAtual = Math.floor(cliquesAtual * 0.05) // Simulado

      // Calcular métricas do período anterior
      const gastoAnterior = campanhasAnterior?.reduce((sum, c) => sum + c.valor_gasto, 0) || 0
      const impressoesAnterior = campanhasAnterior?.reduce((sum, c) => sum + c.impressoes, 0) || 0
      const cliquesAnterior = campanhasAnterior?.reduce((sum, c) => sum + c.cliques, 0) || 0
      const conversoesAnterior = Math.floor(cliquesAnterior * 0.05) // Simulado

      // Calcular variações percentuais
      const calcularVariacao = (atual: number, anterior: number) => {
        if (anterior === 0) return atual > 0 ? 100 : 0
        return ((atual - anterior) / anterior) * 100
      }

      const historicoData: HistoricoData = {
        periodo_atual: {
          gasto_total: gastoAtual,
          impressoes: impressoesAtual,
          cliques: cliquesAtual,
          conversoes: conversoesAtual,
          campanhas: campanhasAtual || [],
        },
        periodo_anterior: {
          gasto_total: gastoAnterior,
          impressoes: impressoesAnterior,
          cliques: cliquesAnterior,
          conversoes: conversoesAnterior,
        },
        variacao: {
          gasto: calcularVariacao(gastoAtual, gastoAnterior),
          impressoes: calcularVariacao(impressoesAtual, impressoesAnterior),
          cliques: calcularVariacao(cliquesAtual, cliquesAnterior),
          conversoes: calcularVariacao(conversoesAtual, conversoesAnterior),
        },
      }

      setHistorico(historicoData)
    } catch (error) {
      console.error("Erro ao buscar histórico:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <ArrowUp className="w-4 h-4 text-green-400" />
    if (variation < 0) return <ArrowDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-neutral-400" />
  }

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-green-400"
    if (variation < 0) return "text-red-400"
    return "text-neutral-400"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">HISTÓRICO DE DESEMPENHO</h1>
          <p className="text-sm text-neutral-400">Análise comparativa de performance por período</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">Cliente</label>
              <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm text-neutral-300">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="15">Últimos 15 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Carregando histórico...</p>
        </div>
      ) : !clienteSelecionado ? (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Selecione um cliente</h3>
            <p className="text-neutral-400">Escolha um cliente para visualizar o histórico de desempenho.</p>
          </CardContent>
        </Card>
      ) : historico ? (
        <>
          {/* Métricas Comparativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-orange-400" />
                    <span className="text-xs text-neutral-400 tracking-wider">GASTO TOTAL</span>
                  </div>
                  {getVariationIcon(historico.variacao.gasto)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatCurrency(historico.periodo_atual.gasto_total)}
                  </p>
                  <p className={`text-sm font-mono ${getVariationColor(historico.variacao.gasto)}`}>
                    {historico.variacao.gasto > 0 ? "+" : ""}
                    {historico.variacao.gasto.toFixed(1)}% vs período anterior
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-400" />
                    <span className="text-xs text-neutral-400 tracking-wider">IMPRESSÕES</span>
                  </div>
                  {getVariationIcon(historico.variacao.impressoes)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatNumber(historico.periodo_atual.impressoes)}
                  </p>
                  <p className={`text-sm font-mono ${getVariationColor(historico.variacao.impressoes)}`}>
                    {historico.variacao.impressoes > 0 ? "+" : ""}
                    {historico.variacao.impressoes.toFixed(1)}% vs período anterior
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-5 h-5 text-purple-400" />
                    <span className="text-xs text-neutral-400 tracking-wider">CLIQUES</span>
                  </div>
                  {getVariationIcon(historico.variacao.cliques)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatNumber(historico.periodo_atual.cliques)}
                  </p>
                  <p className={`text-sm font-mono ${getVariationColor(historico.variacao.cliques)}`}>
                    {historico.variacao.cliques > 0 ? "+" : ""}
                    {historico.variacao.cliques.toFixed(1)}% vs período anterior
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-400" />
                    <span className="text-xs text-neutral-400 tracking-wider">CONVERSÕES</span>
                  </div>
                  {getVariationIcon(historico.variacao.conversoes)}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white font-mono">
                    {formatNumber(historico.periodo_atual.conversoes)}
                  </p>
                  <p className={`text-sm font-mono ${getVariationColor(historico.variacao.conversoes)}`}>
                    {historico.variacao.conversoes > 0 ? "+" : ""}
                    {historico.variacao.conversoes.toFixed(1)}% vs período anterior
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Performance */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                TENDÊNCIA DE PERFORMANCE - ÚLTIMOS {periodo} DIAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                {/* Chart Grid */}
                <div className="absolute inset-0 grid grid-cols-7 grid-rows-8 opacity-20">
                  {Array.from({ length: 56 }).map((_, i) => (
                    <div key={i} className="border border-neutral-700"></div>
                  ))}
                </div>

                {/* Chart Lines */}
                <svg className="absolute inset-0 w-full h-full">
                  <polyline
                    points="0,200 80,180 160,160 240,140 320,120 400,100 480,80"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3"
                  />
                  <polyline
                    points="0,220 80,210 160,200 240,190 320,180 400,170 480,160"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  <polyline
                    points="0,240 80,230 160,220 240,210 320,200 400,190 480,180"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                  />
                  <polyline
                    points="0,180 80,170 160,150 240,130 320,110 400,90 480,70"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                  />
                </svg>

                {/* Legend */}
                <div className="absolute top-4 right-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-orange-500"></div>
                    <span className="text-xs text-neutral-400">Gasto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500 border-dashed"></div>
                    <span className="text-xs text-neutral-400">Impressões</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-green-500"></div>
                    <span className="text-xs text-neutral-400">Cliques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-purple-500"></div>
                    <span className="text-xs text-neutral-400">Conversões</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campanhas Detalhadas */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                CAMPANHAS DO PERÍODO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        CAMPANHA
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        STATUS
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">GASTO</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        IMPRESSÕES
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        CLIQUES
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.periodo_atual.campanhas.map((campanha, index) => (
                      <tr
                        key={campanha.id}
                        className={`border-b border-neutral-800 hover:bg-neutral-700 transition-colors ${
                          index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm text-white">{campanha.nome}</p>
                            <p className="text-xs text-neutral-400">{campanha.objetivo}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            className={
                              campanha.status.toLowerCase() === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }
                          >
                            {campanha.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-white font-mono">
                          {formatCurrency(campanha.valor_gasto)}
                        </td>
                        <td className="py-3 px-4 text-sm text-white font-mono">{formatNumber(campanha.impressoes)}</td>
                        <td className="py-3 px-4 text-sm text-white font-mono">{formatNumber(campanha.cliques)}</td>
                        <td className="py-3 px-4 text-sm text-white font-mono">{campanha.ctr.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
