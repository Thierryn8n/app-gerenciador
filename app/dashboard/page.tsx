"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { Users, TrendingUp, DollarSign, Target, Activity, BarChart3, Globe, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const { usuario } = useAuth()
  const [stats, setStats] = useState({
    totalClientes: 0,
    clientesAtivos: 0,
    contasConectadas: 0,
    campanhasAtivas: 0,
    gastoTotal: 0,
    conversoes: 0,
    contasAnalytics: 0,
    sessoesMes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    console.log('🔍 Dashboard useEffect - usuario:', usuario)
    if (usuario) {
      console.log('✅ Usuário encontrado, verificando onboarding...')
      checkOnboardingStatus()
    } else {
      console.log('❌ Usuário não encontrado')
    }
  }, [usuario])

  const checkOnboardingStatus = async () => {
    console.log('🔍 Verificando status do onboarding para usuário:', usuario?.id)
    try {
      // Verificar se o usuário já tem clientes
      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("id")
        .eq("usuario_id", usuario?.id)
        .limit(1)
      
      console.log('📊 Resultado da consulta de clientes:', { clientes, error })
      
      if (error) {
        console.error("❌ Erro ao verificar clientes:", error)
        fetchStats()
        return
      }
      
      // Se não tem clientes, mostrar onboarding
      if (!clientes || clientes.length === 0) {
        console.log("🎯 Usuário sem clientes - MOSTRANDO ONBOARDING")
        setShowOnboarding(true)
      } else {
        console.log("✅ Usuário já tem clientes - carregando dashboard")
        // Se tem clientes, buscar stats normalmente
        fetchStats()
      }
    } catch (error) {
      console.error("❌ Erro ao verificar status do onboarding:", error)
      fetchStats()
    } finally {
      console.log('🏁 Finalizando verificação do onboarding')
      setCheckingOnboarding(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    fetchStats()
  }

  const fetchStats = async () => {
    try {
      // Buscar estatísticas dos clientes
      const { data: clientes } = await supabase.from("clientes").select("*").eq("usuario_id", usuario?.id)

      const totalClientes = clientes?.length || 0
      const clientesAtivos = clientes?.filter((c) => c.status === "ativo").length || 0

      // Buscar contas conectadas
      const { data: contas } = await supabase
        .from("contas_ads")
        .select("*")
        .in("cliente_id", clientes?.map((c) => c.id) || [])

      const contasConectadas = contas?.length || 0

      // Buscar campanhas ativas
      const { data: campanhas } = await supabase
        .from("campanhas")
        .select("*")
        .in("conta_ads_id", contas?.map((c) => c.id) || [])
        .eq("status", "ACTIVE")

      const campanhasAtivas = campanhas?.length || 0
      const gastoTotal = campanhas?.reduce((sum, c) => sum + (c.valor_gasto || 0), 0) || 0

      // Buscar contas do Google Analytics
      const { data: contasAnalytics } = await supabase
        .from("contas_analytics")
        .select("*")
        .in("cliente_id", clientes?.map((c) => c.id) || [])
        .eq("status", "ativa")

      const contasAnalyticsCount = contasAnalytics?.length || 0

      // Buscar métricas recentes do Analytics (últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: metricas } = await supabase
        .from("metricas_analytics")
        .select("sessoes")
        .in("conta_analytics_id", contasAnalytics?.map((c) => c.id) || [])
        .gte("data_referencia", thirtyDaysAgo.toISOString().split('T')[0])

      const sessoesMes = metricas?.reduce((sum, m) => sum + (m.sessoes || 0), 0) || 0

      setStats({
        totalClientes,
        clientesAtivos,
        contasConectadas,
        campanhasAtivas,
        gastoTotal,
        conversoes: Math.floor(gastoTotal * 0.05), // Simulado
        contasAnalytics: contasAnalyticsCount,
        sessoesMes,
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    } finally {
      setLoading(false)
    }
  }

  if (checkingOnboarding || loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-700 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-neutral-700 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-wider mb-2">PAINEL DE CONTROLE</h1>
        <p className="text-neutral-400">Visão geral das suas operações de tráfego digital</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TOTAL CLIENTES</CardTitle>
            <Users className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">{stats.totalClientes}</div>
            <p className="text-xs text-neutral-500 mt-1">{stats.clientesAtivos} ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CONTAS CONECTADAS</CardTitle>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">{stats.contasConectadas}</div>
            <p className="text-xs text-neutral-500 mt-1">Meta Ads integradas</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CAMPANHAS ATIVAS</CardTitle>
            <Target className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">{stats.campanhasAtivas}</div>
            <p className="text-xs text-neutral-500 mt-1">Em execução</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">INVESTIMENTO TOTAL</CardTitle>
            <DollarSign className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">
              R$ {stats.gastoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">CONVERSÕES</CardTitle>
            <BarChart3 className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">{stats.conversoes}</div>
            <p className="text-xs text-neutral-500 mt-1">Este mês</p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PERFORMANCE</CardTitle>
            <Activity className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white font-mono">94.2%</div>
            <p className="text-xs text-neutral-500 mt-1">Taxa de sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Google Analytics Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-500/30 hover:border-blue-400/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-white tracking-wider">GOOGLE ANALYTICS</CardTitle>
                  <p className="text-sm text-blue-300">Métricas de websites dos clientes</p>
                </div>
              </div>
              <Link href="/analytics">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Acessar Analytics
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">Contas Conectadas</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.contasAnalytics}</p>
                <p className="text-xs text-blue-400">Propriedades GA4</p>
              </div>
              
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Sessões (30d)</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.sessoesMes.toLocaleString('pt-BR')}
                </p>
                <p className="text-xs text-blue-400">Últimos 30 dias</p>
              </div>
              
              <div className="bg-blue-900/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stats.contasAnalytics > 0 ? 'Ativo' : 'Inativo'}
                </p>
                <p className="text-xs text-blue-400">
                  {stats.contasAnalytics > 0 ? 'Coletando dados' : 'Conecte uma conta'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">ATIVIDADE RECENTE</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  time: "2 min atrás",
                  action: "Nova campanha criada",
                  client: "Cliente ABC",
                  status: "success",
                },
                {
                  time: "15 min atrás",
                  action: "Orçamento ajustado",
                  client: "Cliente XYZ",
                  status: "warning",
                },
                {
                  time: "1 hora atrás",
                  action: "Conta Meta conectada",
                  client: "Cliente DEF",
                  status: "success",
                },
                {
                  time: "2 horas atrás",
                  action: "Relatório gerado",
                  client: "Cliente GHI",
                  status: "info",
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-neutral-900 rounded border-l-2 border-orange-500"
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.status === "success"
                        ? "bg-green-500"
                        : activity.status === "warning"
                          ? "bg-yellow-500"
                          : activity.status === "error"
                            ? "bg-red-500"
                            : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{activity.action}</p>
                    <p className="text-xs text-neutral-400">
                      {activity.client} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">PERFORMANCE CHART</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-6 opacity-20">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Line */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,120 50,100 100,110 150,90 200,95 250,85 300,100 350,80"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                />
                <polyline
                  points="0,140 50,135 100,130 150,125 200,130 250,135 300,125 350,120"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-neutral-500 -ml-8 font-mono">
                <span>R$ 10k</span>
                <span>R$ 7.5k</span>
                <span>R$ 5k</span>
                <span>R$ 2.5k</span>
                <span>R$ 0</span>
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-neutral-500 -mb-6 font-mono">
                <span>Jan</span>
                <span>Fev</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>Mai</span>
                <span>Jun</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
