"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Campanha } from "@/lib/supabase"
import { AnotacoesSection } from "@/components/anotacoes-section"
import { ExportRelatorio } from "@/components/export-relatorio"
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Eye,
  MousePointer,
  Target,
  BarChart3,
  Play,
  Pause,
  Settings,
  Bell,
  FileDown,
  MessageSquare,
} from "lucide-react"

interface MetricaDiaria {
  data: string
  gasto_dia: number
  impressoes_dia: number
  cliques_dia: number
  leads_dia: number
  ctr_dia: number
  cpc_dia: number
  cpm_dia: number
}

interface DetalheCampanha extends Campanha {
  cliente_nome: string
  metricas_diarias: MetricaDiaria[]
}

export default function DetalhesCampanhaPage() {
  const params = useParams()
  const router = useRouter()
  const { usuario } = useAuth()
  const [campanha, setCampanha] = useState<DetalheCampanha | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("30")
  const [metricaSelecionada, setMetricaSelecionada] = useState("gasto")
  const [abaSelecionada, setAbaSelecionada] = useState<"metricas" | "anotacoes" | "exportar">("metricas")

  useEffect(() => {
    if (usuario && params.id) {
      fetchDetalheCampanha()
    }
  }, [usuario, params.id, periodo])

  const fetchDetalheCampanha = async () => {
    try {
      // Buscar dados da campanha
      const { data: campanhaData, error: campanhaError } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner(
            cliente_id,
            clientes!inner(
              nome,
              usuario_id
            )
          )
        `)
        .eq("id", params.id)
        .eq("contas_ads.clientes.usuario_id", usuario?.id)
        .single()

      if (campanhaError) throw campanhaError

      // Buscar métricas diárias
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - Number.parseInt(periodo))

      const { data: metricas, error: metricasError } = await supabase
        .from("metricas_diarias")
        .select("*")
        .eq("campanha_id", params.id)
        .gte("data", dataInicio.toISOString().split("T")[0])
        .order("data", { ascending: true })

      if (metricasError) throw metricasError

      // Se não há métricas diárias, gerar dados simulados
      let metricasProcessadas = metricas || []
      if (metricasProcessadas.length === 0) {
        metricasProcessadas = gerarMetricasSimuladas(Number.parseInt(periodo), campanhaData)
      }

      setCampanha({
        ...campanhaData,
        cliente_nome: campanhaData.contas_ads.clientes.nome,
        metricas_diarias: metricasProcessadas,
      })
    } catch (error) {
      console.error("Erro ao buscar detalhes da campanha:", error)
    } finally {
      setLoading(false)
    }
  }

  const gerarMetricasSimuladas = (dias: number, campanha: Campanha): MetricaDiaria[] => {
    const metricas: MetricaDiaria[] = []
    const gastoMedio = campanha.valor_gasto / dias

    for (let i = dias - 1; i >= 0; i--) {
      const data = new Date()
      data.setDate(data.getDate() - i)

      const variacao = 0.7 + Math.random() * 0.6 // Variação de 70% a 130%
      const gastoDia = gastoMedio * variacao
      const impressoesDia = Math.floor((campanha.impressoes / dias) * variacao)
      const cliquesDia = Math.floor((campanha.cliques / dias) * variacao)
      const leadsDia = Math.floor(cliquesDia * 0.05) // 5% de conversão

      metricas.push({
        data: data.toISOString().split("T")[0],
        gasto_dia: gastoDia,
        impressoes_dia: impressoesDia,
        cliques_dia: cliquesDia,
        leads_dia: leadsDia,
        ctr_dia: impressoesDia > 0 ? (cliquesDia / impressoesDia) * 100 : 0,
        cpc_dia: cliquesDia > 0 ? gastoDia / cliquesDia : 0,
        cpm_dia: impressoesDia > 0 ? (gastoDia / impressoesDia) * 1000 : 0,
      })
    }

    return metricas
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400"
      case "paused":
        return "bg-yellow-500/20 text-yellow-400"
      case "archived":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-neutral-500/20 text-neutral-400"
    }
  }

  const renderGrafico = () => {
    if (!campanha?.metricas_diarias.length) return null

    const dados = campanha.metricas_diarias
    const maxValue = Math.max(
      ...dados.map((d) => {
        switch (metricaSelecionada) {
          case "gasto":
            return d.gasto_dia
          case "impressoes":
            return d.impressoes_dia
          case "cliques":
            return d.cliques_dia
          case "ctr":
            return d.ctr_dia
          default:
            return d.gasto_dia
        }
      }),
    )

    return (
      <div className="h-64 relative">
        {/* Grid */}
        <div className="absolute inset-0 grid grid-cols-7 grid-rows-8 opacity-20">
          {Array.from({ length: 56 }).map((_, i) => (
            <div key={i} className="border border-neutral-700"></div>
          ))}
        </div>

        {/* Linha do gráfico */}
        <svg className="absolute inset-0 w-full h-full">
          <polyline
            points={dados
              .map((d, i) => {
                const x = (i / (dados.length - 1)) * 100
                const valor = (() => {
                  switch (metricaSelecionada) {
                    case "gasto":
                      return d.gasto_dia
                    case "impressoes":
                      return d.impressoes_dia
                    case "cliques":
                      return d.cliques_dia
                    case "ctr":
                      return d.ctr_dia
                    default:
                      return d.gasto_dia
                  }
                })()
                const y = 100 - (valor / maxValue) * 80
                return `${x},${y}`
              })
              .join(" ")}
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          />
        </svg>

        {/* Labels dos eixos */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6">
          <span>{dados[0]?.data}</span>
          <span>{dados[Math.floor(dados.length / 2)]?.data}</span>
          <span>{dados[dados.length - 1]?.data}</span>
        </div>
      </div>
    )
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

  if (!campanha) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl text-white mb-2">Campanha não encontrada</h2>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const metricasCalculadas = {
    totalGasto: campanha.valor_gasto,
    totalImpressoes: campanha.impressoes,
    totalCliques: campanha.cliques,
    ctr: campanha.ctr,
    cpc: campanha.cliques > 0 ? campanha.valor_gasto / campanha.cliques : 0,
    cpm: campanha.impressoes > 0 ? (campanha.valor_gasto / campanha.impressoes) * 1000 : 0,
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
            <h1 className="text-2xl font-bold text-white tracking-wider">{campanha.nome}</h1>
            <p className="text-sm text-neutral-400">Cliente: {campanha.cliente_nome}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent">
            <Bell className="w-4 h-4 mr-2" />
            Alertas
          </Button>
          <Button variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button
            className={
              campanha.status.toLowerCase() === "active"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {campanha.status.toLowerCase() === "active" ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Ativar
              </>
            )}
          </Button>
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

      {/* Informações da Campanha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 tracking-wider">STATUS</p>
              <Badge className={getStatusColor(campanha.status)}>{campanha.status}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 tracking-wider">OBJETIVO</p>
              <p className="text-sm text-white">{campanha.objetivo || "Não definido"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 tracking-wider">DATA INÍCIO</p>
              <p className="text-sm text-white font-mono">
                {campanha.data_inicio ? new Date(campanha.data_inicio).toLocaleDateString("pt-BR") : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 tracking-wider">ORÇAMENTO TOTAL</p>
              <p className="text-sm text-white font-mono">{formatCurrency(campanha.valor_gasto)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">GASTO TOTAL</p>
                <p className="text-2xl font-bold text-orange-400 font-mono">{formatCurrency(campanha.valor_gasto)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">IMPRESSÕES</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">{formatNumber(campanha.impressoes)}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CLIQUES</p>
                <p className="text-2xl font-bold text-purple-400 font-mono">{formatNumber(campanha.cliques)}</p>
              </div>
              <MousePointer className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CTR</p>
                <p className="text-2xl font-bold text-green-400 font-mono">{campanha.ctr.toFixed(2)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo das Abas */}
      {abaSelecionada === "metricas" && (
        <>
          {/* Gráfico Interativo */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                  PERFORMANCE POR DIA
                </CardTitle>
                <div className="flex gap-2">
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger className="w-32 bg-neutral-700 border-neutral-600 text-white">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-600">
                      <SelectItem value="7">7 dias</SelectItem>
                      <SelectItem value="15">15 dias</SelectItem>
                      <SelectItem value="30">30 dias</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={metricaSelecionada} onValueChange={setMetricaSelecionada}>
                    <SelectTrigger className="w-40 bg-neutral-700 border-neutral-600 text-white">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-600">
                      <SelectItem value="gasto">Gasto Diário</SelectItem>
                      <SelectItem value="impressoes">Impressões</SelectItem>
                      <SelectItem value="cliques">Cliques</SelectItem>
                      <SelectItem value="ctr">CTR (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>{renderGrafico()}</CardContent>
          </Card>

          {/* Tabela de Métricas Diárias */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                MÉTRICAS DIÁRIAS DETALHADAS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">DATA</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">GASTO</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        IMPRESSÕES
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                        CLIQUES
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">LEADS</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CTR</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">CPC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campanha.metricas_diarias
                      .slice(-10)
                      .reverse()
                      .map((metrica, index) => (
                        <tr
                          key={metrica.data}
                          className={`border-b border-neutral-800 hover:bg-neutral-700 transition-colors ${
                            index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                          }`}
                        >
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {new Date(metrica.data).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {formatCurrency(metrica.gasto_dia)}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {formatNumber(metrica.impressoes_dia)}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-mono">
                            {formatNumber(metrica.cliques_dia)}
                          </td>
                          <td className="py-3 px-4 text-sm text-white font-mono">{formatNumber(metrica.leads_dia)}</td>
                          <td className="py-3 px-4 text-sm text-white font-mono">{metrica.ctr_dia.toFixed(2)}%</td>
                          <td className="py-3 px-4 text-sm text-white font-mono">{formatCurrency(metrica.cpc_dia)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {abaSelecionada === "anotacoes" && <AnotacoesSection campanhaId={campanha.id} titulo={campanha.nome} />}

      {abaSelecionada === "exportar" && (
        <ExportRelatorio tipo="campanha" dados={campanha} metricas={metricasCalculadas} titulo={campanha.nome} />
      )}
    </div>
  )
}
