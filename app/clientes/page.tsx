"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase, type Cliente } from "@/lib/supabase"
import { Plus, Search, Users, TrendingUp, Eye, Settings, MapPin, Clock, Facebook, BarChart3 } from "lucide-react"
import { AdicionarClienteModal } from "@/components/adicionar-cliente-modal"
import { ConectarMetaModal } from "@/components/conectar-meta-modal"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdicionarCliente, setShowAdicionarCliente] = useState(false)
  const [showConectarMeta, setShowConectarMeta] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
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
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL CLIENTES</p>
                <p className="text-2xl font-bold text-white font-mono">{clientes.length}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CLIENTES ATIVOS</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  {clientes.filter((c) => c.status === "ativo").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONTAS CONECTADAS</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">0</p>
              </div>
              <Facebook className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
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
              className="bg-neutral-800 border-neutral-700 hover:border-orange-500/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-white">{cliente.nome}</CardTitle>
                    <p className="text-sm text-neutral-400">{cliente.email}</p>
                  </div>
                  <Badge className={getStatusColor(cliente.status)}>{cliente.status.toUpperCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cliente.empresa && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-500" />
                    <span className="text-sm text-neutral-300">{cliente.empresa}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-300">
                    Criado em {new Date(cliente.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => router.push(`/clientes/${cliente.id}/metricas`)}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Métricas
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleConectarMeta(cliente)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Facebook className="w-4 h-4 mr-1" />
                    Meta
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                  >
                    <Settings className="w-4 h-4" />
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
    </div>
  )
}
