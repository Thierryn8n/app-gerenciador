"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Cliente, type ContaAnalytics, type MetricaAnalytics } from "@/lib/supabase"
import { ConectarGoogleAnalyticsModal } from "@/components/conectar-google-analytics-modal"
import {
  ArrowLeft,
  Users,
  Eye,
  MousePointer,
  Target,
  TrendingUp,
  BarChart3,
  Calendar,
  Filter,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface MetricasAnalytics {
  sessoes: number
  usuarios: number
  visualizacoesPagina: number
  taxaRejeicao: number
  duracaoMediaSessao: number
  conversoes: number
  taxaConversao: number
  dispositivosMobile: number
  dispositivosDesktop: number
  dispositivosTablet: number
  origemOrganica: number
  origemPaga: number
  origemDireta: number
  origemSocial: number
}

export default function AnalyticsClientePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [contasAnalytics, setContasAnalytics] = useState<ContaAnalytics[]>([])
  const [metricas, setMetricas] = useState<MetricasAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [periodo, setPeriodo] = useState("30")
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "detalhado">("overview")

  useEffect(() => {
    if (user && params.id) {
      fetchClienteEAnalytics()
    }
  }, [user, params.id, periodo])

  const fetchClienteEAnalytics = async () => {
    try {
      setLoading(true)

      // Buscar dados do cliente
      const { data: clienteData, error: clienteError } = await supabase
        .from("clientes")
        .select("*")
        .eq("id", params.id)
        .eq("usuario_id", user?.id)
        .single()

      if (clienteError) throw clienteError
      setCliente(clienteData)

      // Buscar contas do Google Analytics do cliente
      const { data: contasData, error: contasError } = await supabase
        .from("contas_analytics")
        .select("*")
        .eq("cliente_id", params.id)

      if (contasError) throw contasError
      setContasAnalytics(contasData || [])

      // Se há contas conectadas, buscar métricas
      if (contasData && contasData.length > 0) {
        await fetchMetricas(contasData[0].id)
      }
    } catch (error) {
      console.error("Erro ao buscar dados do Analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetricas = async (contaId: string) => {
    try {
      const dataInicio = new Date()
      dataInicio.setDate(dataInicio.getDate() - Number.parseInt(periodo))

      const { data: metricasData, error: metricasError } = await supabase
        .from("metricas_analytics")
        .select("*")
        .eq("conta_analytics_id", contaId)
        .gte("data_coleta", dataInicio.toISOString())
        .order("data_coleta", { ascending: false })

      if (metricasError) throw metricasError

      // Agregar métricas
      if (metricasData && metricasData.length > 0) {
        const metricsAgregadas = metricasData.reduce(
          (acc, metric) => {
            acc.sessoes += metric.sessoes || 0
            acc.usuarios += metric.usuarios || 0
            acc.visualizacoesPagina += metric.visualizacoes_pagina || 0
            acc.conversoes += metric.conversoes || 0
            return acc
          },
          {
            sessoes: 0,
            usuarios: 0,
            visualizacoesPagina: 0,
            taxaRejeicao: 0,
            duracaoMediaSessao: 0,
            conversoes: 0,
            taxaConversao: 0,
            dispositivosMobile: 0,
            dispositivosDesktop: 0,
            dispositivosTablet: 0,
            origemOrganica: 0,
            origemPaga: 0,
            origemDireta: 0,
            origemSocial: 0,
          }
        )

        // Calcular métricas derivadas
        const ultimaMetrica = metricasData[0]
        metricsAgregadas.taxaRejeicao = ultimaMetrica.taxa_rejeicao || 0
        metricsAgregadas.duracaoMediaSessao = ultimaMetrica.duracao_media_sessao || 0
        metricsAgregadas.taxaConversao = metricsAgregadas.sessoes > 0 
          ? (metricsAgregadas.conversoes / metricsAgregadas.sessoes) * 100 
          : 0

        // Distribuição de dispositivos (simulada)
        metricsAgregadas.dispositivosMobile = Math.floor(metricsAgregadas.sessoes * 0.6)
        metricsAgregadas.dispositivosDesktop = Math.floor(metricsAgregadas.sessoes * 0.35)
        metricsAgregadas.dispositivosTablet = metricsAgregadas.sessoes - metricsAgregadas.dispositivosMobile - metricsAgregadas.dispositivosDesktop

        // Distribuição de origem (simulada)
        metricsAgregadas.origemOrganica = Math.floor(metricsAgregadas.sessoes * 0.4)
        metricsAgregadas.origemPaga = Math.floor(metricsAgregadas.sessoes * 0.3)
        metricsAgregadas.origemDireta = Math.floor(metricsAgregadas.sessoes * 0.2)
        metricsAgregadas.origemSocial = metricsAgregadas.sessoes - metricsAgregadas.origemOrganica - metricsAgregadas.origemPaga - metricsAgregadas.origemDireta

        setMetricas(metricsAgregadas)
      }
    } catch (error) {
      console.error("Erro ao buscar métricas:", error)
    }
  }

  const handleSyncMetrics = async () => {
    if (contasAnalytics.length === 0) return

    setSyncing(true)
    try {
      const response = await fetch("/api/analytics/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contaId: contasAnalytics[0].id,
        }),
      })

      if (response.ok) {
        await fetchMetricas(contasAnalytics[0].id)
      }
    } catch (error) {
      console.error("Erro ao sincronizar métricas:", error)
    } finally {
      setSyncing(false)
    }
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
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

  if (!cliente) {
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
            <h1 className="text-2xl font-bold text-white tracking-wider">
              GOOGLE ANALYTICS - {cliente.nome.toUpperCase()}
            </h1>
            <p className="text-sm text-neutral-400">Métricas de website e comportamento do usuário</p>
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

          {contasAnalytics.length > 0 && (
            <Button
              onClick={handleSyncMetrics}
              disabled={syncing}
              className="bg-green-600 hover:bg-green-700"
            >
              {syncing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sincronizando...
                </div>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar
                </>
              )}
            </Button>
          )}

          <div className="flex bg-neutral-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={viewMode === "overview" ? "default" : "ghost"}
              onClick={() => setViewMode("overview")}
              className={viewMode === "overview" ? "bg-orange-500 text-white" : "text-neutral-400"}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === "detalhado" ? "default" : "ghost"}
              onClick={() => setViewMode("detalhado")}
              className={viewMode === "detalhado" ? "bg-orange-500 text-white" : "text-neutral-400"}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status da Conexão */}
      {contasAnalytics.length === 0 ? (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="text-center py-12">
            <Globe className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Google Analytics não conectado</h3>
            <p className="text-neutral-400 mb-4">
              Conecte a conta do Google Analytics do cliente para visualizar métricas de website.
            </p>
            <Button
              onClick={() => setShowConnectModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            >
              <Globe className="w-4 h-4 mr-2" />
              Conectar Google Analytics
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status da Conta */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Conta conectada: {contasAnalytics[0].nome_conta}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Propriedade: {contasAnalytics[0].property_id} • Última sincronização:{" "}
                      {new Date(contasAnalytics[0].ultima_sincronizacao).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">ATIVO</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Métricas Principais */}
          {metricas && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">SESSÕES</p>
                        <p className="text-2xl font-bold text-blue-400 font-mono">
                          {formatNumber(metricas.sessoes)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">USUÁRIOS</p>
                        <p className="text-2xl font-bold text-green-400 font-mono">
                          {formatNumber(metricas.usuarios)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">VISUALIZAÇÕES</p>
                        <p className="text-2xl font-bold text-purple-400 font-mono">
                          {formatNumber(metricas.visualizacoesPagina)}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">CONVERSÕES</p>
                        <p className="text-2xl font-bold text-orange-400 font-mono">
                          {formatNumber(metricas.conversoes)}
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-orange-400" />
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
                        <p className="text-xs text-neutral-400 tracking-wider">TAXA DE REJEIÇÃO</p>
                        <p className="text-xl font-bold text-white font-mono">{metricas.taxaRejeicao.toFixed(1)}%</p>
                        <p className="text-xs text-neutral-500">Sessões de uma página</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-neutral-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">DURAÇÃO MÉDIA</p>
                        <p className="text-xl font-bold text-white font-mono">
                          {formatDuration(metricas.duracaoMediaSessao)}
                        </p>
                        <p className="text-xs text-neutral-500">Tempo por sessão</p>
                      </div>
                      <MousePointer className="w-6 h-6 text-neutral-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-neutral-400 tracking-wider">TAXA DE CONVERSÃO</p>
                        <p className="text-xl font-bold text-white font-mono">{metricas.taxaConversao.toFixed(2)}%</p>
                        <p className="text-xs text-neutral-500">Conversões por sessão</p>
                      </div>
                      <Target className="w-6 h-6 text-neutral-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análise Detalhada */}
              {viewMode === "detalhado" && (
                <>
                  {/* Dispositivos */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        DISTRIBUIÇÃO POR DISPOSITIVO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-blue-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Mobile</p>
                              <p className="text-xs text-neutral-400">
                                {((metricas.dispositivosMobile / metricas.sessoes) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-blue-400 font-mono">
                            {formatNumber(metricas.dispositivosMobile)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Monitor className="w-5 h-5 text-green-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Desktop</p>
                              <p className="text-xs text-neutral-400">
                                {((metricas.dispositivosDesktop / metricas.sessoes) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-green-400 font-mono">
                            {formatNumber(metricas.dispositivosDesktop)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Tablet className="w-5 h-5 text-purple-400" />
                            <div>
                              <p className="text-sm font-medium text-white">Tablet</p>
                              <p className="text-xs text-neutral-400">
                                {((metricas.dispositivosTablet / metricas.sessoes) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-purple-400 font-mono">
                            {formatNumber(metricas.dispositivosTablet)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Origem do Tráfego */}
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                        ORIGEM DO TRÁFEGO
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Orgânico</p>
                            <p className="text-xs text-neutral-400">
                              {((metricas.origemOrganica / metricas.sessoes) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-lg font-bold text-green-400 font-mono">
                            {formatNumber(metricas.origemOrganica)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Pago</p>
                            <p className="text-xs text-neutral-400">
                              {((metricas.origemPaga / metricas.sessoes) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-lg font-bold text-orange-400 font-mono">
                            {formatNumber(metricas.origemPaga)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Direto</p>
                            <p className="text-xs text-neutral-400">
                              {((metricas.origemDireta / metricas.sessoes) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-lg font-bold text-blue-400 font-mono">
                            {formatNumber(metricas.origemDireta)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-white">Social</p>
                            <p className="text-xs text-neutral-400">
                              {((metricas.origemSocial / metricas.sessoes) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <p className="text-lg font-bold text-purple-400 font-mono">
                            {formatNumber(metricas.origemSocial)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Modal de Conexão */}
      <ConectarGoogleAnalyticsModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        cliente={cliente}
      />
    </div>
  )
}