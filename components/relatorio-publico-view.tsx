"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Eye, MousePointer, Target, Building2, Activity, DollarSign, BarChart3, Shield } from "lucide-react"

interface RelatorioData {
  relatorio: {
    titulo: string
    descricao: string
    gestor: {
      nome: string
      empresa: string | null
    }
  }
  cliente: {
    nome: string
    empresa: string
    setor: string
    created_at: string
  }
  campanhas: Array<{
    id: string
    nome: string
    tipo: string
    status: string
    orcamento_diario: number
    campanha_tags: Array<{
      tags: {
        nome: string
        cor: string
      }
    }>
  }>
  metricas: Array<{
    campanha_id: string
    impressoes: number
    cliques: number
    gasto: number
    alcance: number
    data: string
  }>
}

export default function RelatorioPublicoView({ token }: { token: string }) {
  const [data, setData] = useState<RelatorioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/relatorio-publico/${token}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao carregar relatório")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400 text-lg">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-gray-900 border-red-500/20 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Acesso Negado</h2>
            <p className="text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  // Calcular métricas consolidadas
  const metricasConsolidadas = data.metricas.reduce(
    (acc, metrica) => {
      acc.impressoes += metrica.impressoes || 0
      acc.cliques += metrica.cliques || 0
      acc.gasto += metrica.gasto || 0
      acc.alcance += metrica.alcance || 0
      return acc
    },
    { impressoes: 0, cliques: 0, gasto: 0, alcance: 0 },
  )

  const ctr =
    metricasConsolidadas.impressoes > 0 ? (metricasConsolidadas.cliques / metricasConsolidadas.impressoes) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativa":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pausada":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "arquivada":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "trafego":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
      case "conversao":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "engajamento":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30"
      case "reconhecimento":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header com Branding */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-cyan-500 to-purple-500 p-3 rounded-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Tactical Command
                </h1>
                <p className="text-gray-400">Sistema de Gestão de Tráfego</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Relatório gerado por</p>
              <p className="font-semibold text-cyan-400">{data.relatorio.gestor.nome}</p>
              {data.relatorio.gestor.empresa && (
                <p className="text-sm text-gray-500">{data.relatorio.gestor.empresa}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Título do Relatório */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {data.relatorio.titulo}
          </h2>
          {data.relatorio.descricao && <p className="text-gray-400 text-lg">{data.relatorio.descricao}</p>}
        </div>

        {/* Informações do Cliente */}
        <Card className="bg-gray-900/50 border-cyan-500/20 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-cyan-400">
              <Building2 className="h-5 w-5 mr-2" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Nome</p>
                <p className="font-semibold text-white">{data.cliente.nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Empresa</p>
                <p className="font-semibold text-white">{data.cliente.empresa}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Setor</p>
                <p className="font-semibold text-white">{data.cliente.setor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Consolidadas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cyan-400 mb-1">Investimento Total</p>
                  <p className="text-2xl font-bold text-white">
                    R$ {metricasConsolidadas.gasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-400 mb-1">Impressões</p>
                  <p className="text-2xl font-bold text-white">
                    {metricasConsolidadas.impressoes.toLocaleString("pt-BR")}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-400 mb-1">Cliques</p>
                  <p className="text-2xl font-bold text-white">
                    {metricasConsolidadas.cliques.toLocaleString("pt-BR")}
                  </p>
                </div>
                <MousePointer className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-400 mb-1">CTR</p>
                  <p className="text-2xl font-bold text-white">{ctr.toFixed(2)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Campanhas */}
        <Card className="bg-gray-900/50 border-cyan-500/20">
          <CardHeader>
            <CardTitle className="flex items-center text-cyan-400">
              <Activity className="h-5 w-5 mr-2" />
              Campanhas Ativas ({data.campanhas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.campanhas.map((campanha) => {
                const metricasCampanha = data.metricas.filter((m) => m.campanha_id === campanha.id)
                const totalGasto = metricasCampanha.reduce((acc, m) => acc + (m.gasto || 0), 0)
                const totalCliques = metricasCampanha.reduce((acc, m) => acc + (m.cliques || 0), 0)
                const totalImpressoes = metricasCampanha.reduce((acc, m) => acc + (m.impressoes || 0), 0)
                const ctrCampanha = totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0

                return (
                  <div key={campanha.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-2">{campanha.nome}</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getStatusColor(campanha.status)}>{campanha.status}</Badge>
                          <Badge className={getTipoColor(campanha.tipo)}>{campanha.tipo}</Badge>
                          {campanha.campanha_tags.map((tag, index) => (
                            <Badge
                              key={index}
                              style={{
                                backgroundColor: `${tag.tags.cor}20`,
                                color: tag.tags.cor,
                                borderColor: `${tag.tags.cor}50`,
                              }}
                              className="border"
                            >
                              {tag.tags.nome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Orçamento Diário</p>
                        <p className="font-semibold text-cyan-400">R$ {campanha.orcamento_diario.toFixed(2)}</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-700/50 mb-3" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 mb-1">Gasto</p>
                        <p className="font-semibold text-white">R$ {totalGasto.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Impressões</p>
                        <p className="font-semibold text-white">{totalImpressoes.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Cliques</p>
                        <p className="font-semibold text-white">{totalCliques.toLocaleString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">CTR</p>
                        <p className="font-semibold text-white">{ctrCampanha.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center py-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            Relatório gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")}
          </p>
          <p className="text-gray-600 text-xs mt-2">Powered by Tactical Command - Sistema de Gestão de Tráfego</p>
        </div>
      </div>
    </div>
  )
}
