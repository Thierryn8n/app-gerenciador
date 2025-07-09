"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  CheckCircle
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">GOOGLE ANALYTICS</h1>
          <p className="text-neutral-400 mt-1">
            Gerencie conexões e acompanhe métricas de websites dos clientes
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-neutral-800 border-neutral-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-neutral-700">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="connections" className="data-[state=active]:bg-neutral-700">
            Conexões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {contasAnalytics.length === 0 ? (
            <Alert className="bg-blue-900/20 border-blue-500/50">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-400">
                Nenhuma conta do Google Analytics conectada. Conecte uma conta para começar a acompanhar métricas.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-6">
              {contasAnalytics.map((conta) => {
                const metricasRecentes = conta.metricas_recentes || []
                const ultimaMetrica = metricasRecentes[0]
                
                return (
                  <Card key={conta.id} className="bg-neutral-800 border-neutral-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            {conta.nome_propriedade}
                          </CardTitle>
                          <CardDescription className="text-neutral-400">
                            Cliente: {conta.clientes.nome} • {conta.url_site}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={conta.status === 'ativa' ? 'default' : 'destructive'}
                            className={conta.status === 'ativa' ? 'bg-green-600' : ''}
                          >
                            {conta.status === 'ativa' ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {conta.status}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncMetrics(conta.id)}
                            disabled={syncing === conta.id}
                            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                          >
                            {syncing === conta.id ? (
                              <div className="w-4 h-4 border-2 border-neutral-400 border-t-white rounded-full animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Sincronizar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {ultimaMetrica && (
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-neutral-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                              <Users className="w-4 h-4" />
                              <span className="text-sm font-medium">Usuários</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatNumber(ultimaMetrica.usuarios)}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {formatNumber(ultimaMetrica.novos_usuarios)} novos
                            </p>
                          </div>
                          
                          <div className="bg-neutral-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                              <Eye className="w-4 h-4" />
                              <span className="text-sm font-medium">Sessões</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatNumber(ultimaMetrica.sessoes)}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {formatNumber(ultimaMetrica.visualizacoes_pagina)} páginas
                            </p>
                          </div>
                          
                          <div className="bg-neutral-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-400 mb-2">
                              <MousePointer className="w-4 h-4" />
                              <span className="text-sm font-medium">Taxa Rejeição</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {(ultimaMetrica.taxa_rejeicao * 100).toFixed(1)}%
                            </p>
                          </div>
                          
                          <div className="bg-neutral-900 p-4 rounded-lg">
                            <div className="flex items-center gap-2 text-purple-400 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-medium">Conversões</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {formatNumber(ultimaMetrica.conversoes)}
                            </p>
                            {ultimaMetrica.receita > 0 && (
                              <p className="text-xs text-neutral-400">
                                {formatCurrency(ultimaMetrica.receita)}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {ultimaMetrica.dispositivos && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-neutral-900 p-4 rounded-lg">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-blue-400" />
                                Origem do Tráfego
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(ultimaMetrica.origem_trafego || {}).slice(0, 3).map(([origem, sessoes]) => (
                                  <div key={origem} className="flex justify-between text-sm">
                                    <span className="text-neutral-300 capitalize">{origem}</span>
                                    <span className="text-white font-medium">{formatNumber(sessoes as number)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="bg-neutral-900 p-4 rounded-lg">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Monitor className="w-4 h-4 text-green-400" />
                                Dispositivos
                              </h4>
                              <div className="space-y-2">
                                {Object.entries(ultimaMetrica.dispositivos || {}).map(([device, sessoes]) => (
                                  <div key={device} className="flex justify-between text-sm">
                                    <span className="text-neutral-300 flex items-center gap-2">
                                      {getDeviceIcon(device)}
                                      <span className="capitalize">{device}</span>
                                    </span>
                                    <span className="text-white font-medium">{formatNumber(sessoes as number)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid gap-4">
            {clientes.map((cliente) => {
              const contaConectada = contasAnalytics.find(c => c.cliente_id === cliente.id)
              
              return (
                <Card key={cliente.id} className="bg-neutral-800 border-neutral-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{cliente.nome}</h3>
                        <p className="text-neutral-400 text-sm">{cliente.email}</p>
                        {cliente.empresa && (
                          <p className="text-neutral-500 text-sm">{cliente.empresa}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {contaConectada ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Conectado
                            </Badge>
                            <span className="text-sm text-neutral-400">
                              {contaConectada.nome_propriedade}
                            </span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleConnectAnalytics(cliente)}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Conectar Analytics
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

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