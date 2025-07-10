"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConectarGoogleAnalyticsModal } from "@/components/conectar-google-analytics-modal"
import { supabase, type Cliente, type ContaAnalytics, type MetricaAnalytics } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { 
  BarChart3, 
  Users, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Monitor,
  Tablet,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Calendar,
  Filter,
  Download,
  Activity,
  Target,
  Clock
} from "lucide-react"
import { toast } from "sonner"

interface ContaAnalyticsWithMetricas extends ContaAnalytics {
  clientes: Cliente
  metricas_recentes?: MetricaAnalytics[]
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [contasAnalytics, setContasAnalytics] = useState<ContaAnalyticsWithMetricas[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [filtroCliente, setFiltroCliente] = useState<string>("todos")
  const [periodo, setPeriodo] = useState<string>("30d")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", user?.id)
        .eq("status", "ativo")
        .order("nome")

      if (clientesError) throw clientesError
      setClientes(clientesData || [])

      // Carregar contas do Google Analytics
      const { data: contasData, error: contasError } = await supabase
        .from("contas_analytics")
        .select(`
          *,
          clientes!inner(
            id,
            nome,
            email,
            empresa,
            usuario_id
          )
        `)
        .eq("clientes.usuario_id", user?.id)
        .order("nome_conta")

      if (contasError) throw contasError

      // Para cada conta, buscar métricas recentes
      const contasComMetricas = await Promise.all(
        (contasData || []).map(async (conta) => {
          const { data: metricas } = await supabase
            .from("metricas_analytics")
            .select("*")
            .eq("conta_analytics_id", conta.id)
            .order("data_referencia", { ascending: false })
            .limit(7)

          return {
            ...conta,
            metricas_recentes: metricas || []
          }
        })
      )

      setContasAnalytics(contasComMetricas)
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
      toast.error("Erro ao carregar dados do Google Analytics")
    } finally {
      setLoading(false)
    }
  }

  const handleConnectAnalytics = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setShowConnectModal(true)
  }

  const handleSyncMetrics = async (contaId: string) => {
    try {
      setSyncing(contaId)
      
      const response = await fetch("/api/analytics/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contaAnalyticsId: contaId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro na sincronização")
      }

      toast.success(result.message)
      loadData() // Recarregar dados
    } catch (error: any) {
      console.error("Erro na sincronização:", error)
      toast.error(error.message || "Erro ao sincronizar métricas")
    } finally {
      setSyncing(null)
    }
  }

  // Filtrar dados baseado no cliente selecionado
  const contasFiltradas = filtroCliente === "todos" 
    ? contasAnalytics 
    : contasAnalytics.filter(conta => conta.cliente_id === filtroCliente)

  // Calcular estatísticas agregadas
  const calcularEstatisticas = () => {
    const todasMetricas = contasFiltradas.flatMap(conta => conta.metricas_recentes || [])
    
    const totalUsuarios = todasMetricas.reduce((sum, m) => sum + (m.usuarios || 0), 0)
    const totalSessoes = todasMetricas.reduce((sum, m) => sum + (m.sessoes || 0), 0)
    const totalPageviews = todasMetricas.reduce((sum, m) => sum + (m.visualizacoes_pagina || 0), 0)
    const totalConversoes = todasMetricas.reduce((sum, m) => sum + (m.conversoes || 0), 0)
    
    const taxaRejeicaoMedia = todasMetricas.length > 0 
      ? todasMetricas.reduce((sum, m) => sum + (m.taxa_rejeicao || 0), 0) / todasMetricas.length
      : 0
    
    const duracaoSessaoMedia = todasMetricas.length > 0
      ? todasMetricas.reduce((sum, m) => sum + (m.duracao_sessao_media || 0), 0) / todasMetricas.length
      : 0

    return {
      totalUsuarios,
      totalSessoes,
      totalPageviews,
      totalConversoes,
      taxaRejeicaoMedia,
      duracaoSessaoMedia,
      contasAtivas: contasFiltradas.filter(c => c.status === 'ativa').length,
      totalContas: contasFiltradas.length
    }
  }

  const stats = calcularEstatisticas()

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num)
  }

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-neutral-400">
          <div className="w-6 h-6 border-2 border-neutral-600 border-t-orange-500 rounded-full animate-spin"></div>
          Carregando Google Analytics...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Google Analytics Dashboard</h1>
          <p className="text-neutral-400">Monitore e analise as métricas dos seus clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroCliente} onValueChange={setFiltroCliente}>
            <SelectTrigger className="w-48 bg-neutral-800 border-neutral-700">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="todos">Todos os clientes</SelectItem>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32 bg-neutral-800 border-neutral-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-700">
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Usuários */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">USUÁRIOS TOTAIS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{formatNumber(stats.totalUsuarios)}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                <p className="text-xs text-white/70">Últimos {periodo === '7d' ? '7' : periodo === '30d' ? '30' : '90'} dias</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Sessões */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                  <Eye className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">SESSÕES</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{formatNumber(stats.totalSessoes)}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"></div>
                <p className="text-xs text-white/70">Total de sessões</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Taxa Rejeição */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">TAXA REJEIÇÃO</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{(stats.taxaRejeicaoMedia * 100).toFixed(1)}%</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"></div>
                <p className="text-xs text-white/70">Média geral</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Conversões */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 backdrop-blur-sm">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">CONVERSÕES</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{formatNumber(stats.totalConversoes)}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"></div>
                <p className="text-xs text-white/70">Total de conversões</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Performance */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Performance de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {/* Grid do gráfico */}
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-8 opacity-20">
                {Array.from({ length: 56 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Linha do gráfico */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,200 50,180 100,160 150,140 200,120 250,100 300,90 350,80"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                />
                <polyline
                  points="0,220 50,210 100,200 150,190 200,180 250,170 300,160 350,150"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Labels do eixo Y */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-12 font-mono">
                <span>10k</span>
                <span>7.5k</span>
                <span>5k</span>
                <span>2.5k</span>
                <span>0</span>
              </div>

              {/* Labels do eixo X */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Seg</span>
                <span>Ter</span>
                <span>Qua</span>
                <span>Qui</span>
                <span>Sex</span>
                <span>Sáb</span>
                <span>Dom</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-neutral-400">Usuários</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-neutral-400">Sessões</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Detalhadas */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Estatísticas Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">Contas Ativas</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.contasAtivas}</p>
                <p className="text-xs text-blue-400">de {stats.totalContas} total</p>
              </div>
              
              <div className="bg-neutral-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Duração Média</span>
                </div>
                <p className="text-2xl font-bold text-white">{Math.round(stats.duracaoSessaoMedia)}s</p>
                <p className="text-xs text-green-400">Por sessão</p>
              </div>
              
              <div className="bg-neutral-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Pageviews</span>
                </div>
                <p className="text-2xl font-bold text-white">{formatNumber(stats.totalPageviews)}</p>
                <p className="text-xs text-purple-400">Total de visualizações</p>
              </div>
              
              <div className="bg-neutral-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-400 mb-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">Taxa Conversão</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.totalSessoes > 0 ? ((stats.totalConversoes / stats.totalSessoes) * 100).toFixed(2) : '0.00'}%
                </p>
                <p className="text-xs text-orange-400">Conversões/Sessões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">Contas Conectadas</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-neutral-600">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm" className="border-neutral-600">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contasFiltradas.length === 0 ? (
            <Alert className="bg-blue-900/20 border-blue-500/50">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                Nenhuma conta do Google Analytics conectada. Conecte uma conta para começar a acompanhar métricas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contasFiltradas.map((conta) => {
                const ultimaMetrica = conta.metricas_recentes?.[0]

                return (
                  <Card key={conta.id} className="bg-neutral-900 border-neutral-700 hover:border-blue-500/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-white mb-1">
                            {conta.nome_propriedade}
                          </CardTitle>
                          <CardDescription className="text-neutral-400">
                            {conta.clientes.nome}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <Globe className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-neutral-300">{conta.url_site}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={conta.status === 'ativa' ? "default" : "secondary"}
                            className={conta.status === 'ativa' ? "bg-green-600 hover:bg-green-700" : "bg-neutral-600"}
                          >
                            {conta.status === 'ativa' ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncMetrics(conta.id)}
                            disabled={syncing === conta.id}
                            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                          >
                            {syncing === conta.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {ultimaMetrica ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-neutral-800 p-3 rounded">
                            <div className="flex items-center gap-2 text-blue-400 mb-1">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-medium">Usuários</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                              {formatNumber(ultimaMetrica.usuarios || 0)}
                            </p>
                          </div>
                          
                          <div className="bg-neutral-800 p-3 rounded">
                            <div className="flex items-center gap-2 text-green-400 mb-1">
                              <Eye className="w-4 h-4" />
                              <span className="text-xs font-medium">Sessões</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                              {formatNumber(ultimaMetrica.sessoes || 0)}
                            </p>
                          </div>
                          
                          <div className="bg-neutral-800 p-3 rounded">
                            <div className="flex items-center gap-2 text-orange-400 mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-medium">Taxa Rejeição</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                              {((ultimaMetrica.taxa_rejeicao || 0) * 100).toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="bg-neutral-800 p-3 rounded">
                            <div className="flex items-center gap-2 text-purple-400 mb-1">
                              <Target className="w-4 h-4" />
                              <span className="text-xs font-medium">Conversões</span>
                            </div>
                            <p className="text-lg font-bold text-white">
                              {formatNumber(ultimaMetrica.conversoes || 0)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <BarChart3 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                          <p className="text-neutral-500 text-sm">Nenhuma métrica disponível</p>
                          <p className="text-neutral-600 text-xs">Clique em sincronizar</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção de Gerenciamento de Clientes */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Gerenciar Conexões</CardTitle>
          <CardDescription className="text-neutral-400">
            Conecte ou visualize o status das contas do Google Analytics para cada cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {clientes.map((cliente) => {
               const contaCliente = contasAnalytics.find(c => c.cliente_id === cliente.id)
               
               return (
                 <div key={cliente.id} className="bg-neutral-900 p-4 rounded-lg border border-neutral-700">
                   <div className="flex items-center justify-between mb-3">
                     <h3 className="font-medium text-white">{cliente.nome}</h3>
                     {contaCliente ? (
                       <Badge className="bg-green-600 hover:bg-green-700">
                         <CheckCircle className="w-3 h-3 mr-1" />
                         Conectado
                       </Badge>
                     ) : (
                       <Badge variant="secondary" className="bg-neutral-600">
                         <AlertCircle className="w-3 h-3 mr-1" />
                         Não conectado
                       </Badge>
                     )}
                   </div>
                   
                   {contaCliente ? (
                     <div className="space-y-2">
                       <p className="text-sm text-neutral-400">
                         Propriedade: {contaCliente.nome_propriedade}
                       </p>
                       <p className="text-sm text-neutral-400">
                         Status: {contaCliente.status === 'ativa' ? 'Ativa' : 'Inativa'}
                       </p>
                     </div>
                   ) : (
                     <Button
                       size="sm"
                       onClick={() => handleConnectAnalytics(cliente)}
                       className="w-full bg-blue-600 hover:bg-blue-700"
                     >
                       <Plus className="w-3 h-3 mr-1" />
                       Conectar Analytics
                     </Button>
                   )}
                 </div>
               )
             })}
           </div>
        </CardContent>
      </Card>

      <ConectarGoogleAnalyticsModal
        open={showConnectModal}
        onOpenChange={(open) => {
          setShowConnectModal(open)
          if (!open) {
            setSelectedCliente(null)
            loadData() // Recarregar dados quando fechar o modal
          }
        }}
        cliente={selectedCliente}
      />
    </div>
  )
}