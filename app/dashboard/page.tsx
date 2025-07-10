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
        {/* Card Total Clientes */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">TOTAL CLIENTES</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{stats.totalClientes}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                <p className="text-xs text-white/70">{stats.clientesAtivos} ativos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Contas Conectadas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">CONTAS CONECTADAS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{stats.contasConectadas}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"></div>
                <p className="text-xs text-white/70">Meta Ads integradas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Campanhas Ativas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20 backdrop-blur-sm">
                  <Target className="h-5 w-5 text-violet-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-white/90 tracking-wide">CAMPANHAS ATIVAS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">{stats.campanhasAtivas}</div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"></div>
                <p className="text-xs text-white/70">Em execução</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Investimento Total */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">INVESTIMENTO TOTAL</p>
                <p className="text-2xl font-bold text-white font-mono">R$ {stats.gastoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card Conversões */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONVERSÕES</p>
                <p className="text-2xl font-bold text-white font-mono">{stats.conversoes}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-pink-400" />
            </div>
          </CardContent>
        </Card>

        {/* Card Performance */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PERFORMANCE</p>
                <p className="text-2xl font-bold text-white font-mono">94.2%</p>
              </div>
              <Activity className="w-8 h-8 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Analytics Section */}
      <Card className="bg-neutral-800 border-neutral-700 mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-400" />
              <div>
                <CardTitle className="text-lg font-bold text-white">Google Analytics</CardTitle>
                <p className="text-sm text-neutral-400">Métricas de websites dos clientes</p>
              </div>
            </div>
            <Link href="/analytics">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                Acessar Analytics
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contas Conectadas */}
            <div className="p-4 rounded-lg bg-neutral-700 border border-neutral-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-400 tracking-wider">Contas Conectadas</p>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">{stats.contasAnalytics}</p>
              <p className="text-xs text-neutral-500">Propriedades GA4</p>
            </div>

            {/* Sessões */}
            <div className="p-4 rounded-lg bg-neutral-700 border border-neutral-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-400 tracking-wider">Sessões (30d)</p>
                <Users className="w-4 h-4 text-violet-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {stats.sessoesMes.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-neutral-500">Últimos 30 dias</p>
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg bg-neutral-700 border border-neutral-600">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-neutral-400 tracking-wider">Status</p>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-white font-mono">
                {stats.contasAnalytics > 0 ? 'Ativo' : 'Inativo'}
              </p>
              <p className="text-xs text-neutral-500">
                {stats.contasAnalytics > 0 ? 'Coletando dados' : 'Conecte uma conta'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-400" />
              <CardTitle className="text-lg font-bold text-white">Atividade Recente</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
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
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-700 border border-neutral-600">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === "success" ? "bg-green-400" :
                    activity.status === "warning" ? "bg-yellow-400" : "bg-blue-400"
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{activity.action}</p>
                    <p className="text-xs text-neutral-400">{activity.client} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Chart */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <CardTitle className="text-lg font-bold text-white">Performance Chart</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-neutral-700 rounded-lg border border-neutral-600 flex items-center justify-center">
              <p className="text-neutral-400 text-sm">Gráfico de performance será exibido aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
