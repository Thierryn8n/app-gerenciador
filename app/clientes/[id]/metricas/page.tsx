"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Cliente, type Campanha } from "@/lib/supabase"
import { AnotacoesSection } from "@/components/anotacoes-section"
import { ExportRelatorio } from "@/components/export-relatorio"
import {
  ArrowLeft,
  DollarSign,
  MousePointer,
  Target,
  Eye,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  MessageSquare,
  FileDown,
} from "lucide-react"

interface MetricasCliente {
  totalGasto: number
  totalCliques: number
  totalConversoes: number
  totalImpressoes: number
  cpm: number
  cpc: number
  ctr: number
  campanhas: Campanha[]
}

export default function MetricasClientePage() {
  const params = useParams()
  const router = useRouter()
  const { usuario } = useAuth()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [metricas, setMetricas] = useState<MetricasCliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("7")
  const [campanhaFiltro, setCampanhaFiltro] = useState("todas")
  const [viewMode, setViewMode] = useState<"grafico" | "tabela">("grafico")
  const [abaSelecionada, setAbaSelecionada] = useState<"metricas" | "anotacoes" | "exportar">("metricas")

  useEffect(() => {
    if (usuario && params.id) {
      fetchClienteEMetricas()
    }
  }, [usuario, params.id, periodo, campanhaFiltro])

  const fetchClienteEMetricas = async () => {
    try {
      // Buscar dados do cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", params.id)
        .eq("usuario_id", usuario?.id)
        .single()

      if (clienteError) throw clienteError
      setCliente(clienteData)

      // Buscar campanhas e métricas
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - Number.parseInt(periodo))

      const { data: campanhasData, error: campanhasError } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner(
            cliente_id
          )
        `)
        .eq("contas_ads.cliente_id", params.id)
        .gte("ultima_atualizacao", dataInicio.toISOString())

      if (campanhasError) throw campanhasError

      // Filtrar por campanha se selecionado
      let campanhasFiltradas = campanhasData || []
      if (campanhaFiltro !== "todas") {
        campanhasFiltradas = campanhasFiltradas.filter((c) => c.id === campanhaFiltro)
      }

      // Calcular métricas agregadas
      const totalGasto = campanhasFiltradas.reduce((sum, c) => sum + c.valor_gasto, 0)
      const totalCliques = campanhasFiltradas.reduce((sum, c) => sum + c.cliques, 0)
      const totalImpressoes = campanhasFiltradas.reduce((sum, c) => sum + c.impressoes, 0)
      const totalConversoes = Math.floor(totalCliques * 0.05) // Simulado - 5% de conversão

      const cpm = totalImpressoes > 0 ? (totalGasto / totalImpressoes) * 1000 : 0
      const cpc = totalCliques > 0 ? totalGasto / totalCliques : 0
      const ctr = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0

      setMetricas({
        totalGasto,
        totalCliques,
        totalConversoes,
        totalImpressoes,
        cpm,
        cpc,
        ctr,
        campanhas: campanhasFiltradas,
      })
    } catch (error) {
      console.error("Erro ao buscar métricas:", error)
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

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!cliente || !metricas) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl text-white mb-2">Cliente não encontrado</h2>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-orange-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">MÉTRICAS - {cliente.nome.toUpperCase()}</h1>
            <p className="text-sm text-neutral-400">Análise detalhada de performance das campanhas</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32 bg-neutral-800 border-neutral-600 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600">
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={campanhaFiltro} onValueChange={setCampanhaFiltro}>
            <SelectTrigger className="w-48 bg-neutral-800 border-neutral-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600">
              <SelectItem value="todas">Todas as campanhas</SelectItem>
              {metricas.campanhas.map((campanha) => (
                <SelectItem key={campanha.id} value={campanha.id}>
                  {campanha.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex bg-neutral-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "grafico" ? "default" : "ghost"}
              onClick={() => setViewMode("grafico")}
              className={viewMode === "grafico" ? "bg-orange-500 text-white" : "text-neutral-400"}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "tabela" ? "default" : "ghost"}
              onClick={() => setViewMode("tabela")}
              className={viewMode === "tabela" ? "bg-orange-500 text-white" : "text-neutral-400"}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex gap-2 border-b border-neutral-700">
        <Button
          variant={abaSelecionada === "metricas" ? "default" : "ghost"}
          onClick={() => setAbaSelecionada("metricas")}
          className={abaSelecionada === "metricas" ? "bg-orange-500 text-white" : "text-neutral-400"}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Métricas
        </Button>
        <Button
          variant={abaSelecionada === "anotacoes" ? "default" : "ghost"}
          onClick={() => setAbaSelecionada("anotacoes")}
          className={abaSelecionada === "anotacoes" ? "bg-orange-500 text-white" : "text-neutral-400"}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Anotações
        </Button>
        <Button
          variant={abaSelecionada === "exportar" ? "default" : "ghost"}
          onClick={() => setAbaSelecionada("exportar")}
          className={abaSelecionada === "exportar" ? "bg-orange-500 text-white" : "text-neutral-400"}
        >
          <FileDown className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Conteúdo das Abas */}
      {abaSelecionada === "metricas" && (
        <>
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">TOTAL GASTO</p>
                    <p className="text-2xl font-bold text-orange-400 font-mono">
                      {formatCurrency(metricas.totalGasto)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">TOTAL CLIQUES</p>
                    <p className="text-2xl font-bold text-blue-400 font-mono">{formatNumber(metricas.totalCliques)}</p>
                  </div>
                  <MousePointer className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">CONVERSÕES</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">
                      {formatNumber(metricas.totalConversoes)}
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">IMPRESSÕES</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">
                      {formatNumber(metricas.totalImpressoes)}
                    </p>
                  </div>
                  <Eye className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPIs Secundários */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">CPM</p>
                    <p className="text-xl font-bold text-white font-mono">{formatCurrency(metricas.cpm)}</p>
                    <p className="text-xs text-neutral-500">Custo por mil impressões</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-neutral-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">CPC</p>
                    <p className="text-xl font-bold text-white font-mono">{formatCurrency(metricas.cpc)}</p>
                    <p className="text-xs text-neutral-500">Custo por clique</p>
                  </div>
                  <MousePointer className="w-6 h-6 text-neutral-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-400 tracking-wider">CTR</p>
                    <p className="text-xl font-bold text-white font-mono">{metricas.ctr.toFixed(2)}%</p>
                    <p className="text-xs text-neutral-500">Taxa de cliques</p>
                  </div>
                  <Target className="w-6 h-6 text-neutral-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualização de Dados */}
          {viewMode === "grafico" ? (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  PERFORMANCE POR PERÍODO
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
                  </svg>

                  {/* Legend */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-orange-500"></div>
                      <span className="text-xs text-neutral-400">Gasto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-blue-500 border-dashed"></div>
                      <span className="text-xs text-neutral-400">Cliques</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-green-500"></div>
                      <span className="text-xs text-neutral-400">Conversões</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  CAMPANHAS DETALHADAS
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
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          GASTO
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          CLIQUES
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                          IMPRESSÕES
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CTR</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.campanhas.map((campanha, index) => (
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
                          <td className="py-3 px-4 text-sm text-white font-mono">{formatNumber(campanha.cliques)}</td>
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {formatNumber(campanha.impressoes)}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-mono">{campanha.ctr.toFixed(2)}%</td>
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {campanha.cliques > 0 ? formatCurrency(campanha.valor_gasto / campanha.cliques) : "R$ 0,00"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {abaSelecionada === "anotacoes" && <AnotacoesSection clienteId={cliente.id} titulo={cliente.nome} />}

      {abaSelecionada === "exportar" && (
        <ExportRelatorio tipo="cliente" dados={cliente} metricas={metricas} titulo={cliente.nome} />
      )}
    </div>
  )
}
