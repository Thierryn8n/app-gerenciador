"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import {
  DollarSign,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Filter,
  TrendingUp,
} from "lucide-react"

interface Cliente {
  id: string
  nome: string
  email: string
  empresa?: string
}

interface ConfiguracaoCobranca {
  id: string
  cliente_id: string
  valor_mensal: number
  dia_vencimento: number
  ativo: boolean
  observacoes?: string
}

interface FaturamentoCliente {
  id: string
  cliente_id: string
  mes_referencia: string
  valor_mensal: number
  status_pagamento: "pago" | "pendente" | "atrasado" | "cancelado"
  data_vencimento: string
  data_pagamento?: string
  observacoes?: string
  metodo_pagamento?: string
  numero_fatura?: string
  cliente: Cliente
}

export function GestaoFinanceira() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [faturamentos, setFaturamentos] = useState<FaturamentoCliente[]>([])
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoCobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovaCobranca, setShowNovaCobranca] = useState(false)
  const [showConfigurarCliente, setShowConfigurarCliente] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState("")
  const [mesReferencia, setMesReferencia] = useState(new Date().toISOString().substring(0, 7))
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().substring(0, 7))

  // Estados para configuração de cliente
  const [valorMensal, setValorMensal] = useState("")
  const [diaVencimento, setDiaVencimento] = useState("5")
  const [observacoes, setObservacoes] = useState("")

  useEffect(() => {
    if (usuario) {
      fetchDados()
    }
  }, [usuario, filtroMes, filtroStatus])

  const fetchDados = async () => {
    try {
      await Promise.all([fetchClientes(), fetchFaturamentos(), fetchConfiguracoes()])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, email, empresa")
      .eq("usuario_id", usuario?.id)
      .eq("status", "ativo")

    if (error) throw error
    setClientes(data || [])
  }

  const fetchFaturamentos = async () => {
    let query = supabase
      .from("faturamento_clientes")
      .select(`
        *,
        cliente:clientes(id, nome, email, empresa)
      `)
      .in("cliente_id", supabase.from("clientes").select("id").eq("usuario_id", usuario?.id))

    if (filtroStatus !== "todos") {
      query = query.eq("status_pagamento", filtroStatus)
    }

    if (filtroMes) {
      const inicioMes = `${filtroMes}-01`
      const fimMes = new Date(filtroMes + "-01")
      fimMes.setMonth(fimMes.getMonth() + 1)
      fimMes.setDate(0)

      query = query.gte("mes_referencia", inicioMes).lte("mes_referencia", fimMes.toISOString().split("T")[0])
    }

    const { data, error } = await query.order("mes_referencia", { ascending: false })

    if (error) throw error
    setFaturamentos(data || [])
  }

  const fetchConfiguracoes = async () => {
    const { data, error } = await supabase
      .from("configuracoes_cobranca")
      .select("*")
      .in("cliente_id", supabase.from("clientes").select("id").eq("usuario_id", usuario?.id))

    if (error) throw error
    setConfiguracoes(data || [])
  }

  const criarFaturamento = async () => {
    if (!clienteSelecionado || !mesReferencia) return

    try {
      const config = configuracoes.find((c) => c.cliente_id === clienteSelecionado)
      if (!config) {
        alert("Configure primeiro o valor mensal para este cliente")
        return
      }

      const dataVencimento = new Date(`${mesReferencia}-${config.dia_vencimento.toString().padStart(2, "0")}`)

      const { error } = await supabase.from("faturamento_clientes").insert({
        cliente_id: clienteSelecionado,
        mes_referencia: `${mesReferencia}-01`,
        valor_mensal: config.valor_mensal,
        status_pagamento: "pendente",
        data_vencimento: dataVencimento.toISOString().split("T")[0],
        numero_fatura: `FAT-${Date.now()}`,
      })

      if (error) throw error

      setShowNovaCobranca(false)
      setClienteSelecionado("")
      await fetchFaturamentos()
      alert("Faturamento criado com sucesso!")
    } catch (error: any) {
      console.error("Erro ao criar faturamento:", error)
      alert("Erro ao criar faturamento: " + error.message)
    }
  }

  const configurarCliente = async () => {
    if (!clienteSelecionado || !valorMensal) return

    try {
      const { error } = await supabase.from("configuracoes_cobranca").upsert(
        {
          cliente_id: clienteSelecionado,
          valor_mensal: Number.parseFloat(valorMensal),
          dia_vencimento: Number.parseInt(diaVencimento),
          ativo: true,
          observacoes,
        },
        { onConflict: "cliente_id" },
      )

      if (error) throw error

      setShowConfigurarCliente(false)
      setClienteSelecionado("")
      setValorMensal("")
      setObservacoes("")
      await fetchConfiguracoes()
      alert("Configuração salva com sucesso!")
    } catch (error: any) {
      console.error("Erro ao configurar cliente:", error)
      alert("Erro ao configurar cliente: " + error.message)
    }
  }

  const atualizarStatusPagamento = async (faturamentoId: string, novoStatus: string) => {
    try {
      const updateData: any = { status_pagamento: novoStatus }
      if (novoStatus === "pago") {
        updateData.data_pagamento = new Date().toISOString().split("T")[0]
      }

      const { error } = await supabase.from("faturamento_clientes").update(updateData).eq("id", faturamentoId)

      if (error) throw error

      await fetchFaturamentos()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
    }
  }

  const gerarFaturamentosAutomaticos = async () => {
    try {
      const hoje = new Date()
      const mesAtual = hoje.toISOString().substring(0, 7)

      for (const config of configuracoes.filter((c) => c.ativo)) {
        // Verificar se já existe faturamento para este mês
        const existente = faturamentos.find(
          (f) => f.cliente_id === config.cliente_id && f.mes_referencia.startsWith(mesAtual),
        )

        if (!existente) {
          const dataVencimento = new Date(`${mesAtual}-${config.dia_vencimento.toString().padStart(2, "0")}`)

          await supabase.from("faturamento_clientes").insert({
            cliente_id: config.cliente_id,
            mes_referencia: `${mesAtual}-01`,
            valor_mensal: config.valor_mensal,
            status_pagamento: "pendente",
            data_vencimento: dataVencimento.toISOString().split("T")[0],
            numero_fatura: `FAT-${Date.now()}-${config.cliente_id.substring(0, 8)}`,
          })
        }
      }

      await fetchFaturamentos()
      alert("Faturamentos automáticos gerados com sucesso!")
    } catch (error) {
      console.error("Erro ao gerar faturamentos automáticos:", error)
      alert("Erro ao gerar faturamentos automáticos")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pago":
        return "bg-green-500/20 text-green-400"
      case "pendente":
        return "bg-yellow-500/20 text-yellow-400"
      case "atrasado":
        return "bg-red-500/20 text-red-400"
      case "cancelado":
        return "bg-neutral-500/20 text-neutral-400"
      default:
        return "bg-neutral-500/20 text-neutral-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pago":
        return <CheckCircle className="w-4 h-4" />
      case "pendente":
        return <Clock className="w-4 h-4" />
      case "atrasado":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const calcularEstatisticas = () => {
    const total = faturamentos.reduce((sum, f) => sum + f.valor_mensal, 0)
    const pago = faturamentos.filter((f) => f.status_pagamento === "pago").reduce((sum, f) => sum + f.valor_mensal, 0)
    const pendente = faturamentos
      .filter((f) => f.status_pagamento === "pendente")
      .reduce((sum, f) => sum + f.valor_mensal, 0)
    const atrasado = faturamentos
      .filter((f) => f.status_pagamento === "atrasado")
      .reduce((sum, f) => sum + f.valor_mensal, 0)

    return { total, pago, pendente, atrasado }
  }

  const stats = calcularEstatisticas()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-neutral-800 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wider">GESTÃO FINANCEIRA</h2>
          <p className="text-sm text-neutral-400">Controle de faturamento e pagamentos dos clientes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={gerarFaturamentosAutomaticos} className="bg-blue-600 hover:bg-blue-700">
            <Calendar className="w-4 h-4 mr-2" />
            Gerar Faturamentos
          </Button>
          <Dialog open={showConfigurarCliente} onOpenChange={setShowConfigurarCliente}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Configurar Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-800 border-neutral-700">
              <DialogHeader>
                <DialogTitle className="text-white">Configurar Cobrança do Cliente</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Defina o valor mensal e dia de vencimento para o cliente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Cliente</Label>
                  <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-700 border-neutral-600">
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id} className="text-white">
                          {cliente.nome} - {cliente.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Valor Mensal (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valorMensal}
                      onChange={(e) => setValorMensal(e.target.value)}
                      className="bg-neutral-700 border-neutral-600 text-white"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-neutral-300">Dia de Vencimento</Label>
                    <Select value={diaVencimento} onValueChange={setDiaVencimento}>
                      <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-700 border-neutral-600">
                        {Array.from({ length: 28 }, (_, i) => i + 1).map((dia) => (
                          <SelectItem key={dia} value={dia.toString()} className="text-white">
                            Dia {dia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Observações</Label>
                  <Input
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="bg-neutral-700 border-neutral-600 text-white"
                    placeholder="Observações sobre a cobrança..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={configurarCliente} className="bg-orange-500 hover:bg-orange-600">
                    Salvar Configuração
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowConfigurarCliente(false)}
                    className="border-neutral-600 text-neutral-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNovaCobranca} onOpenChange={setShowNovaCobranca}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Cobrança
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-800 border-neutral-700">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Cobrança</DialogTitle>
                <DialogDescription className="text-neutral-400">
                  Criar uma nova cobrança para um cliente específico.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-neutral-300">Cliente</Label>
                  <Select value={clienteSelecionado} onValueChange={setClienteSelecionado}>
                    <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-700 border-neutral-600">
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id} className="text-white">
                          {cliente.nome} - {cliente.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-neutral-300">Mês de Referência</Label>
                  <Input
                    type="month"
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    className="bg-neutral-700 border-neutral-600 text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={criarFaturamento} className="bg-orange-500 hover:bg-orange-600">
                    Criar Cobrança
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNovaCobranca(false)}
                    className="border-neutral-600 text-neutral-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL FATURADO</p>
                <p className="text-2xl font-bold text-white font-mono">
                  R$ {stats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PAGO</p>
                <p className="text-2xl font-bold text-green-400 font-mono">
                  R$ {stats.pago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PENDENTE</p>
                <p className="text-2xl font-bold text-yellow-400 font-mono">
                  R$ {stats.pendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ATRASADO</p>
                <p className="text-2xl font-bold text-red-400 font-mono">
                  R$ {stats.atrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-300">Filtros:</span>
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-neutral-400">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-32 bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-700 border-neutral-600">
                    <SelectItem value="todos" className="text-white">
                      Todos
                    </SelectItem>
                    <SelectItem value="pago" className="text-white">
                      Pago
                    </SelectItem>
                    <SelectItem value="pendente" className="text-white">
                      Pendente
                    </SelectItem>
                    <SelectItem value="atrasado" className="text-white">
                      Atrasado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-neutral-400">Mês</Label>
                <Input
                  type="month"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="w-40 bg-neutral-700 border-neutral-600 text-white"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Faturamentos */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="w-5 h-5 text-orange-500" />
            FATURAMENTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faturamentos.length === 0 ? (
              <p className="text-neutral-400 text-center py-8">Nenhum faturamento encontrado</p>
            ) : (
              faturamentos.map((faturamento) => (
                <div
                  key={faturamento.id}
                  className="flex items-center justify-between p-4 bg-neutral-900 rounded border-l-2 border-orange-500"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(faturamento.status_pagamento)}
                      <Badge className={getStatusColor(faturamento.status_pagamento)}>
                        {faturamento.status_pagamento.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-white font-medium">{faturamento.cliente.nome}</p>
                      <p className="text-sm text-neutral-400">
                        {new Date(faturamento.mes_referencia).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        • Vence em {new Date(faturamento.data_vencimento).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-white font-mono">
                        R$ {faturamento.valor_mensal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      {faturamento.numero_fatura && (
                        <p className="text-xs text-neutral-400">{faturamento.numero_fatura}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {faturamento.status_pagamento === "pendente" && (
                        <Button
                          size="sm"
                          onClick={() => atualizarStatusPagamento(faturamento.id, "pago")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar como Pago
                        </Button>
                      )}
                      {faturamento.status_pagamento === "pago" && (
                        <Button
                          size="sm"
                          onClick={() => atualizarStatusPagamento(faturamento.id, "pendente")}
                          variant="outline"
                          className="border-neutral-600 text-neutral-300"
                        >
                          Marcar como Pendente
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
