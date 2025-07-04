"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { User, Shield, LogOut, Save, Activity, AlertTriangle, Trash2, Key, Database, Facebook } from "lucide-react"

interface ApiUsage {
  requests_today: number
  limit_daily: number
  percentage_used: number
}

export default function ConfiguracoesPage() {
  const { usuario, signOut } = useAuth()
  const [apiUsage, setApiUsage] = useState<ApiUsage>({
    requests_today: 0,
    limit_daily: 1000,
    percentage_used: 0,
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [selectedClienteId, setSelectedClienteId] = useState("")
  const [clientes, setClientes] = useState([])
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario) {
      fetchApiUsage()
      fetchClientes()
    }
  }, [usuario])

  const fetchApiUsage = async () => {
    // Simular dados de uso da API - em produção, isso viria de um log real
    const today = new Date().toDateString()
    const requests = Math.floor(Math.random() * 800) + 100 // Simular entre 100-900 requests
    const limit = 1000
    const percentage = (requests / limit) * 100

    setApiUsage({
      requests_today: requests,
      limit_daily: limit,
      percentage_used: percentage,
    })
  }

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase.from("clientes").select("id, nome, email").eq("usuario_id", usuario?.id)

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    }
  }

  const handleDeleteCliente = async () => {
    if (!selectedClienteId) return

    setLoading(true)
    try {
      // Deletar em cascata: campanhas -> tokens -> contas -> cliente
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", selectedClienteId)
        .eq("usuario_id", usuario?.id)

      if (error) throw error

      setShowDeleteDialog(false)
      setSelectedClienteId("")
      fetchClientes()
    } catch (error) {
      console.error("Erro ao deletar cliente:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem")
      return
    }

    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setShowPasswordDialog(false)
      setNewPassword("")
      setConfirmPassword("")
      alert("Senha alterada com sucesso!")
    } catch (error) {
      console.error("Erro ao alterar senha:", error)
      alert("Erro ao alterar senha")
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeMetaTokens = async () => {
    setLoading(true)
    try {
      // Revogar todos os tokens Meta do usuário
      const { error } = await supabase
        .from("tokens_meta")
        .delete()
        .in(
          "conta_ads_id",
          supabase
            .from("contas_ads")
            .select("id")
            .in("cliente_id", supabase.from("clientes").select("id").eq("usuario_id", usuario?.id)),
        )

      if (error) throw error
      alert("Tokens Meta revogados com sucesso!")
    } catch (error) {
      console.error("Erro ao revogar tokens:", error)
      alert("Erro ao revogar tokens")
    } finally {
      setLoading(false)
    }
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-400"
    if (percentage >= 70) return "text-yellow-400"
    return "text-green-400"
  }

  const getUsageBgColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500"
    if (percentage >= 70) return "bg-yellow-500"
    return "bg-green-500"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">CONFIGURAÇÕES</h1>
          <p className="text-sm text-neutral-400">Gerencie suas preferências e configurações da conta</p>
        </div>
        <Button
          onClick={signOut}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <Card className="lg:col-span-2 bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5 text-orange-500" />
              PERFIL DO USUÁRIO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-neutral-300">
                  Nome Completo
                </Label>
                <Input
                  id="nome"
                  defaultValue={usuario?.nome}
                  className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={usuario?.email}
                  className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-neutral-300">
                  Empresa
                </Label>
                <Input
                  id="empresa"
                  defaultValue={usuario?.empresa}
                  className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-neutral-300">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  defaultValue={usuario?.telefone}
                  className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500"
                />
              </div>
            </div>

            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* API Usage & Security */}
        <div className="space-y-6">
          {/* API Usage */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Activity className="w-5 h-5 text-orange-500" />
                USO DA API META
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Requisições hoje</span>
                  <span className={`font-mono ${getUsageColor(apiUsage.percentage_used)}`}>
                    {apiUsage.requests_today}/{apiUsage.limit_daily}
                  </span>
                </div>
                <div className="w-full bg-neutral-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageBgColor(apiUsage.percentage_used)}`}
                    style={{ width: `${Math.min(apiUsage.percentage_used, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-neutral-500">
                  {apiUsage.percentage_used.toFixed(1)}% do limite diário utilizado
                </p>
              </div>

              {apiUsage.percentage_used >= 80 && (
                <Alert className="bg-yellow-900/20 border-yellow-500/50">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertDescription className="text-yellow-400">
                    <strong>Atenção:</strong> Você está próximo do limite diário da API Meta.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Security Actions */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-orange-500" />
                SEGURANÇA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-800 border-neutral-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Alterar Senha</DialogTitle>
                    <DialogDescription className="text-neutral-400">Digite sua nova senha abaixo.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-neutral-300">
                        Nova Senha
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-neutral-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-neutral-300">
                        Confirmar Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-neutral-700 border-neutral-600 text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleChangePassword}
                        disabled={loading}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {loading ? "Alterando..." : "Alterar Senha"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordDialog(false)}
                        className="border-neutral-600 text-neutral-300"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleRevokeMetaTokens}
                disabled={loading}
                variant="outline"
                className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Revogar Tokens Meta
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card className="bg-neutral-800 border-neutral-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5 text-orange-500" />
                GERENCIAR DADOS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Cliente
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-800 border-neutral-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Excluir Cliente</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                      Esta ação não pode ser desfeita. Todos os dados do cliente serão permanentemente removidos.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="clienteSelect" className="text-neutral-300">
                        Selecionar Cliente
                      </Label>
                      <select
                        id="clienteSelect"
                        value={selectedClienteId}
                        onChange={(e) => setSelectedClienteId(e.target.value)}
                        className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded text-white"
                      >
                        <option value="">Selecione um cliente</option>
                        {clientes.map((cliente: any) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nome} - {cliente.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Alert className="bg-red-900/20 border-red-500/50">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400">
                        <strong>Cuidado:</strong> Esta ação irá excluir permanentemente o cliente e todos os dados
                        relacionados (campanhas, métricas, tokens).
                      </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeleteCliente}
                        disabled={loading || !selectedClienteId}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {loading ? "Excluindo..." : "Confirmar Exclusão"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                        className="border-neutral-600 text-neutral-300"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
