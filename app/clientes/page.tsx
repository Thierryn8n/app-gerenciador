"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Cliente } from "@/lib/supabase"
import { Plus, Search, Users, TrendingUp, Eye, Settings, MapPin, Clock, Facebook, BarChart3, Globe, ChevronDown, ChevronUp } from "lucide-react"
import { AdicionarClienteModal } from "@/components/adicionar-cliente-modal"
import { ConectarMetaModal } from "@/components/conectar-meta-modal"
import { ConectarGoogleAnalyticsModal } from "@/components/conectar-google-analytics-modal"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdicionarCliente, setShowAdicionarCliente] = useState(false)
  const [showConectarMeta, setShowConectarMeta] = useState(false)
  const [showConectarAnalytics, setShowConectarAnalytics] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [expandedCards, setExpandedCards] = useState({})
  const router = useRouter()

  useEffect(() => {
    if (usuario) {
      fetchClientes()
    }
  }, [usuario])

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.empresa?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ativo":
        return "bg-green-500/20 text-green-400"
      case "inativo":
        return "bg-red-500/20 text-red-400"
      case "pausado":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-neutral-500/20 text-neutral-400"
    }
  }

  const handleConectarMeta = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setShowConectarMeta(true)
  }

  const handleConectarAnalytics = (cliente: Cliente) => {
    setClienteSelecionado(cliente)
    setShowConectarAnalytics(true)
  }

  const toggleCardExpansion = (clienteId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [clienteId]: !prev[clienteId]
    }))
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 bg-neutral-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">GESTÃO DE CLIENTES</h1>
          <p className="text-sm text-neutral-400">Gerencie seus clientes e suas contas de anúncios</p>
        </div>
        <Button
          onClick={() => setShowAdicionarCliente(true)}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Total Clientes */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10"></div>
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 tracking-wider font-medium">TOTAL CLIENTES</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-tight">{clientes.length}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/20 backdrop-blur-sm">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Clientes Ativos */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10"></div>
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 tracking-wider font-medium">CLIENTES ATIVOS</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-tight">
                    {clientes.filter((c) => c.status === "ativo").length}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/20 backdrop-blur-sm">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1 w-12 bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Contas Conectadas */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Card className="relative bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-purple-500/10"></div>
            <CardContent className="relative p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70 tracking-wider font-medium">CONTAS CONECTADAS</p>
                  <p className="text-2xl font-bold text-white font-mono tracking-tight">0</p>
                </div>
                <div className="p-2 rounded-lg bg-violet-500/20 backdrop-blur-sm">
                  <Facebook className="w-8 h-8 text-violet-400" />
                </div>
              </div>
              <div className="mt-2">
                <div className="h-1 w-12 bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Buscar clientes por nome, email ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clientes Grid */}
      {filteredClientes.length === 0 ? (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {clientes.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </h3>
            <p className="text-neutral-400 mb-4">
              {clientes.length === 0
                ? "Comece adicionando seu primeiro cliente para gerenciar suas campanhas."
                : "Tente ajustar os termos de busca."}
            </p>
            {clientes.length === 0 && (
              <Button
                onClick={() => setShowAdicionarCliente(true)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map((cliente) => (
            <Card
              key={cliente.id}
              className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white mb-1 tracking-wide">{cliente.nome}</CardTitle>
                    <p className="text-sm text-neutral-400">{cliente.email}</p>
                    {cliente.empresa && (
                      <div className="flex items-center gap-2 mt-2">
                        <MapPin className="w-3 h-3 text-neutral-500" />
                        <span className="text-xs text-neutral-400">{cliente.empresa}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(cliente.status)}>{cliente.status.toUpperCase()}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleCardExpansion(cliente.id)}
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-white hover:bg-neutral-700"
                    >
                      {expandedCards[cliente.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Informações do Cliente */}
                <div className="bg-neutral-900/50 rounded-lg p-3 border border-neutral-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span className="text-xs text-neutral-400 tracking-wider">CRIADO EM</span>
                  </div>
                  <p className="text-sm text-neutral-300 font-mono">
                    {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Seções Expansíveis */}
                {expandedCards[cliente.id] && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Seção de Métricas */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-neutral-400 tracking-wider font-medium">ANÁLISES</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/clientes/${cliente.id}/metricas`)}
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-xs"
                        >
                          <Facebook className="w-3 h-3 mr-1" />
                          Meta Ads
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/clientes/${cliente.id}/analytics`)}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-xs"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                    
                    {/* Seção de Conexões */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Settings className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-neutral-400 tracking-wider font-medium">CONEXÕES</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConectarMeta(cliente)}
                          variant="outline"
                          className="border-blue-600/50 text-blue-400 hover:bg-blue-600/10 hover:border-blue-500 text-xs"
                        >
                          <Facebook className="w-3 h-3 mr-1" />
                          Meta
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleConectarAnalytics(cliente)}
                          variant="outline"
                          className="border-green-600/50 text-green-400 hover:bg-green-600/10 hover:border-green-500 text-xs"
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          Google
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ações Rápidas */}
                <div className="flex gap-2 pt-2 border-t border-neutral-700/50">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/clientes/${cliente.id}/metricas`)}
                    className="flex-1 border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent text-xs"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Visualizar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <AdicionarClienteModal
        open={showAdicionarCliente}
        onOpenChange={setShowAdicionarCliente}
        onClienteAdicionado={fetchClientes}
      />

      <ConectarMetaModal open={showConectarMeta} onOpenChange={setShowConectarMeta} cliente={clienteSelecionado} />

      <ConectarGoogleAnalyticsModal
        open={showConectarAnalytics}
        onOpenChange={setShowConectarAnalytics}
        cliente={clienteSelecionado}
      />
    </div>
  )
}
