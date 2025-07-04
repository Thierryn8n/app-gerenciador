"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { AdicionarTagsCampanha } from "@/components/adicionar-tags-campanha"
import { GerenciarTags } from "@/components/gerenciar-tags"
import { GerenciarRelatoriosPublicos } from "@/components/gerenciar-relatorios-publicos"
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Target,
  Calendar,
  Tag,
  Share2,
  Settings,
  BarChart3,
  Users,
  AlertTriangle,
} from "lucide-react"

interface Campanha {
  id: string
  campanha_id: string
  nome: string
  status: string
  objetivo?: string
  tipo?: string
  valor_gasto: number
  alcance: number
  impressoes: number
  cliques: number
  ctr: number
  data_inicio?: string
  data_fim?: string
  ultima_atualizacao: string
  contas_ads: {
    id: string
    plataforma: string
    nome_conta: string
    clientes: {
      id: string
      nome: string
      email: string
    }
  }
  campanhas_tags?: Array<{
    tag: {
      id: string
      nome: string
      cor: string
    }
  }>
}

interface FiltrosState {
  busca: string
  status: string
  tipo: string
  cliente: string
  tag: string
  ordenacao: string
  direcao: "asc" | "desc"
}

export default function CampanhasPage() {
  const { usuario } = useAuth()
  const [campanhas, setCampanhas] = useState<Campanha[]>([])
  const [clientes, setClientes] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"campanhas" | "tags" | "relatorios">("campanhas")
  const [filtros, setFiltros] = useState<FiltrosState>({
    busca: "",
    status: "all", // Updated default value
    tipo: "all", // Updated default value
    cliente: "all", // Updated default value
    tag: "all", // Updated default value
    ordenacao: "nome",
    direcao: "asc",
  })

  useEffect(() => {
    if (usuario) {
      fetchCampanhas()
      fetchClientes()
      fetchTags()
    }
  }, [usuario])

  const fetchCampanhas = async () => {
    try {
      const { data, error } = await supabase
        .from("campanhas")
        .select(`
          *,
          contas_ads!inner (
            id,
            plataforma,
            nome_conta,
            clientes!inner (
              id,
              nome,
              email
            )
          ),
          campanhas_tags (
            tag:tags_campanha (
              id,
              nome,
              cor
            )
          )
        `)
        .eq("contas_ads.clientes.usuario_id", usuario?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCampanhas(data || [])
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome, email")
        .eq("usuario_id", usuario?.id)
        .order("nome")

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags_campanha")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("nome")

      if (error) throw error
      setTags(data || [])
    } catch (error) {
      console.error("Erro ao buscar tags:", error)
    }
  }

  // Filtrar e ordenar campanhas
  const campanhasFiltradas = useMemo(() => {
    let resultado = [...campanhas]

    // Filtro por busca
    if (filtros.busca) {
      resultado = resultado.filter(
        (campanha) =>
          campanha.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
          campanha.contas_ads.clientes.nome.toLowerCase().includes(filtros.busca.toLowerCase()),
      )
    }

    // Filtro por status
    if (filtros.status !== "all") {
      resultado = resultado.filter((campanha) => campanha.status === filtros.status)
    }

    // Filtro por tipo
    if (filtros.tipo !== "all") {
      resultado = resultado.filter((campanha) => campanha.tipo === filtros.tipo)
    }

    // Filtro por cliente
    if (filtros.cliente !== "all") {
      resultado = resultado.filter((campanha) => campanha.contas_ads.clientes.id === filtros.cliente)
    }

    // Filtro por tag
    if (filtros.tag !== "all") {
      resultado = resultado.filter((campanha) => campanha.campanhas_tags?.some((ct) => ct.tag.id === filtros.tag))
    }

    // Ordenação
    resultado.sort((a, b) => {
      let valorA: any, valorB: any

      switch (filtros.ordenacao) {
        case "nome":
          valorA = a.nome.toLowerCase()
          valorB = b.nome.toLowerCase()
          break
        case "gasto":
          valorA = a.valor_gasto
          valorB = b.valor_gasto
          break
        case "cliques":
          valorA = a.cliques
          valorB = b.cliques
          break
        case "ctr":
          valorA = a.ctr
          valorB = b.ctr
          break
        case "alcance":
          valorA = a.alcance
          valorB = b.alcance
          break
        case "atualizacao":
          valorA = new Date(a.ultima_atualizacao)
          valorB = new Date(b.ultima_atualizacao)
          break
        default:
          valorA = a.nome.toLowerCase()
          valorB = b.nome.toLowerCase()
      }

      if (valorA < valorB) return filtros.direcao === "asc" ? -1 : 1
      if (valorA > valorB) return filtros.direcao === "asc" ? 1 : -1
      return 0
    })

    return resultado
  }, [campanhas, filtros])

  // Estatísticas das campanhas filtradas
  const estatisticas = useMemo(() => {
    const totalGasto = campanhasFiltradas.reduce((sum, c) => sum + c.valor_gasto, 0)
    const totalCliques = campanhasFiltradas.reduce((sum, c) => sum + c.cliques, 0)
    const totalImpressoes = campanhasFiltradas.reduce((sum, c) => sum + c.impressoes, 0)
    const totalAlcance = campanhasFiltradas.reduce((sum, c) => sum + c.alcance, 0)
    const campanhasAtivas = campanhasFiltradas.filter((c) => c.status === "ACTIVE").length

    return {
      total: campanhasFiltradas.length,
      ativas: campanhasAtivas,
      totalGasto,
      totalCliques,
      totalImpressoes,
      totalAlcance,
      ctrMedio: totalImpressoes > 0 ? (totalCliques / totalImpressoes) * 100 : 0,
    }
  }, [campanhasFiltradas])

  const limparFiltros = () => {
    setFiltros({
      busca: "",
      status: "all",
      tipo: "all",
      cliente: "all",
      tag: "all",
      ordenacao: "nome",
      direcao: "asc",
    })
  }

  const toggleOrdenacao = (campo: string) => {
    if (filtros.ordenacao === campo) {
      setFiltros((prev) => ({
        ...prev,
        direcao: prev.direcao === "asc" ? "desc" : "asc",
      }))
    } else {
      setFiltros((prev) => ({
        ...prev,
        ordenacao: campo,
        direcao: "asc",
      }))
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "PAUSED":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "ARCHIVED":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
      default:
        return "bg-neutral-500/20 text-neutral-400 border-neutral-500/50"
    }
  }

  const handleTagsUpdated = (campanhaId: string, novasTags: any[]) => {
    setCampanhas((prev) =>
      prev.map((campanha) =>
        campanha.id === campanhaId
          ? {
              ...campanha,
              campanhas_tags: novasTags.map((tag) => ({ tag })),
            }
          : campanha,
      ),
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CAMPANHAS</h1>
          <p className="text-sm text-neutral-400">Gerencie e monitore suas campanhas publicitárias</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-neutral-800 p-1 rounded-lg">
          <Button
            size="sm"
            variant={activeTab === "campanhas" ? "default" : "ghost"}
            onClick={() => setActiveTab("campanhas")}
            className={activeTab === "campanhas" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400"}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Campanhas
          </Button>
          <Button
            size="sm"
            variant={activeTab === "tags" ? "default" : "ghost"}
            onClick={() => setActiveTab("tags")}
            className={activeTab === "tags" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400"}
          >
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </Button>
          <Button
            size="sm"
            variant={activeTab === "relatorios" ? "default" : "ghost"}
            onClick={() => setActiveTab("relatorios")}
            className={activeTab === "relatorios" ? "bg-orange-500 hover:bg-orange-600" : "text-neutral-400"}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Relatórios Públicos
          </Button>
        </div>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {activeTab === "tags" && <GerenciarTags />}
      {activeTab === "relatorios" && <GerenciarRelatoriosPublicos />}

      {activeTab === "campanhas" && (
        <>
          {/* Filtros Avançados */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
                <Filter className="w-4 h-4" />
                FILTROS AVANÇADOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <Input
                    placeholder="Buscar campanhas..."
                    value={filtros.busca}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
                    className="pl-10 bg-neutral-700 border-neutral-600 text-white"
                  />
                </div>

                {/* Status */}
                <Select
                  value={filtros.status}
                  onValueChange={(value) => setFiltros((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="PAUSED">Pausado</SelectItem>
                    <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Tipo */}
                <Select
                  value={filtros.tipo}
                  onValueChange={(value) => setFiltros((prev) => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="trafego">Tráfego</SelectItem>
                    <SelectItem value="conversao">Conversão</SelectItem>
                    <SelectItem value="engajamento">Engajamento</SelectItem>
                    <SelectItem value="reconhecimento">Reconhecimento</SelectItem>
                  </SelectContent>
                </Select>

                {/* Cliente */}
                <Select
                  value={filtros.cliente}
                  onValueChange={(value) => setFiltros((prev) => ({ ...prev, cliente: value }))}
                >
                  <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    {clientes.map((cliente: any) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Tag */}
                <Select value={filtros.tag} onValueChange={(value) => setFiltros((prev) => ({ ...prev, tag: value }))}>
                  <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-600">
                    <SelectItem value="all">Todas as Tags</SelectItem>
                    {tags.map((tag: any) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                          {tag.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Limpar Filtros */}
                <Button
                  variant="outline"
                  onClick={limparFiltros}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpar
                </Button>
              </div>

              {/* Ordenação */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-neutral-400">Ordenar por:</span>
                {[
                  { key: "nome", label: "Nome" },
                  { key: "gasto", label: "Gasto" },
                  { key: "cliques", label: "Cliques" },
                  { key: "ctr", label: "CTR" },
                  { key: "alcance", label: "Alcance" },
                  { key: "atualizacao", label: "Atualização" },
                ].map(({ key, label }) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={filtros.ordenacao === key ? "default" : "outline"}
                    onClick={() => toggleOrdenacao(key)}
                    className={
                      filtros.ordenacao === key
                        ? "bg-orange-500 hover:bg-orange-600"
                        : "border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                    }
                  >
                    {label}
                    {filtros.ordenacao === key &&
                      (filtros.direcao === "asc" ? (
                        <SortAsc className="w-3 h-3 ml-1" />
                      ) : (
                        <SortDesc className="w-3 h-3 ml-1" />
                      ))}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas das Campanhas Filtradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-400 font-medium">TOTAL</p>
                    <p className="text-xl font-bold text-white">{estatisticas.total}</p>
                  </div>
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-green-400 font-medium">ATIVAS</p>
                    <p className="text-xl font-bold text-white">{estatisticas.ativas}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-400 font-medium">GASTO</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(estatisticas.totalGasto)}</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-purple-400 font-medium">CLIQUES</p>
                    <p className="text-lg font-bold text-white">{formatNumber(estatisticas.totalCliques)}</p>
                  </div>
                  <MousePointer className="w-6 h-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-yellow-400 font-medium">IMPRESSÕES</p>
                    <p className="text-lg font-bold text-white">{formatNumber(estatisticas.totalImpressoes)}</p>
                  </div>
                  <Eye className="w-6 h-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-pink-400 font-medium">CTR MÉDIO</p>
                    <p className="text-lg font-bold text-white">{estatisticas.ctrMedio.toFixed(2)}%</p>
                  </div>
                  <Target className="w-6 h-6 text-pink-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Campanhas */}
          <div className="space-y-4">
            {campanhasFiltradas.length === 0 ? (
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {campanhas.length === 0
                      ? "Nenhuma campanha encontrada"
                      : "Nenhuma campanha corresponde aos filtros"}
                  </h3>
                  <p className="text-neutral-400 mb-4">
                    {campanhas.length === 0
                      ? "Conecte suas contas de anúncios para visualizar campanhas"
                      : "Tente ajustar os filtros para encontrar as campanhas desejadas"}
                  </p>
                  {campanhas.length > 0 && (
                    <Button onClick={limparFiltros} className="bg-orange-500 hover:bg-orange-600">
                      Limpar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              campanhasFiltradas.map((campanha) => (
                <Card
                  key={campanha.id}
                  className="bg-neutral-800 border-neutral-700 hover:border-neutral-600 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-medium text-white">{campanha.nome}</h3>
                          <Badge className={getStatusColor(campanha.status)}>{campanha.status}</Badge>
                          {campanha.tipo && (
                            <Badge className="bg-neutral-700 text-neutral-300 border-neutral-600">
                              {campanha.tipo}
                            </Badge>
                          )}
                        </div>

                        {/* Tags da Campanha */}
                        <AdicionarTagsCampanha
                          campanhaId={campanha.id}
                          campanhaName={campanha.nome}
                          tagsAtuais={campanha.campanhas_tags?.map((ct) => ct.tag) || []}
                          onTagsUpdated={(novasTags) => handleTagsUpdated(campanha.id, novasTags)}
                        />

                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {campanha.contas_ads.clientes.nome}
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="w-4 h-4" />
                            {campanha.contas_ads.plataforma.toUpperCase()}
                          </div>
                          {campanha.data_inicio && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Início: {formatDate(campanha.data_inicio)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Atualizado: {formatDate(campanha.ultima_atualizacao)}
                          </div>
                        </div>

                        {campanha.objetivo && (
                          <p className="text-sm text-neutral-400">
                            <strong>Objetivo:</strong> {campanha.objetivo}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center min-w-0 lg:min-w-[400px]">
                        <div>
                          <p className="text-xs text-neutral-400">Gasto</p>
                          <p className="text-sm font-medium text-white">{formatCurrency(campanha.valor_gasto)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400">Cliques</p>
                          <p className="text-sm font-medium text-white">{formatNumber(campanha.cliques)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400">Impressões</p>
                          <p className="text-sm font-medium text-white">{formatNumber(campanha.impressoes)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-400">CTR</p>
                          <p className="text-sm font-medium text-white">{campanha.ctr.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Informações sobre Filtros */}
          {(filtros.busca ||
            filtros.status !== "all" ||
            filtros.tipo !== "all" ||
            filtros.cliente !== "all" ||
            filtros.tag !== "all") && (
            <Alert className="bg-neutral-800/50 border-neutral-600">
              <Filter className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-neutral-300">
                <strong>Filtros ativos:</strong> Mostrando {campanhasFiltradas.length} de {campanhas.length} campanhas.
                {filtros.busca && ` Busca: "${filtros.busca}"`}
                {filtros.status !== "all" && ` Status: ${filtros.status}`}
                {filtros.tipo !== "all" && ` Tipo: ${filtros.tipo}`}
                {filtros.cliente !== "all" && ` Cliente selecionado`}
                {filtros.tag !== "all" && ` Tag selecionada`}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  )
}
