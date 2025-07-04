"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Share2, Copy, Trash2, Plus, ExternalLink, Calendar, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RelatorioPublico {
  id: string
  titulo: string
  descricao: string
  token: string
  cliente_id: string
  ativo: boolean
  expira_em: string | null
  created_at: string
  cliente: {
    nome: string
  }
}

interface Cliente {
  id: string
  nome: string
}

export function GerenciarRelatoriosPublicos() {
  const [relatorios, setRelatorios] = useState<RelatorioPublico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    cliente_id: "",
    ativo: true,
    expira_em: "",
  })
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      carregarRelatorios()
      carregarClientes()
    }
  }, [user])

  const carregarRelatorios = async () => {
    try {
      const { data, error } = await supabase
        .from("relatorios_publicos")
        .select(`
          *,
          cliente:clientes(nome)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRelatorios(data || [])
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios públicos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase.from("clientes").select("id, nome").order("nome")

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    }
  }

  const criarRelatorio = async () => {
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      const { error } = await supabase.from("relatorios_publicos").insert([
        {
          ...formData,
          token,
          expira_em: formData.expira_em || null,
        },
      ])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Relatório público criado com sucesso!",
      })

      setDialogOpen(false)
      setFormData({
        titulo: "",
        descricao: "",
        cliente_id: "",
        ativo: true,
        expira_em: "",
      })
      carregarRelatorios()
    } catch (error) {
      console.error("Erro ao criar relatório:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o relatório público.",
        variant: "destructive",
      })
    }
  }

  const toggleStatus = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase.from("relatorios_publicos").update({ ativo }).eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Relatório ${ativo ? "ativado" : "desativado"} com sucesso!`,
      })

      carregarRelatorios()
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do relatório.",
        variant: "destructive",
      })
    }
  }

  const excluirRelatorio = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este relatório público?")) return

    try {
      const { error } = await supabase.from("relatorios_publicos").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Relatório público excluído com sucesso!",
      })

      carregarRelatorios()
    } catch (error) {
      console.error("Erro ao excluir relatório:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o relatório público.",
        variant: "destructive",
      })
    }
  }

  const copiarLink = (token: string) => {
    const link = `${window.location.origin}/relatorio/${token}`
    navigator.clipboard.writeText(link)
    toast({
      title: "Link copiado!",
      description: "O link do relatório foi copiado para a área de transferência.",
    })
  }

  const abrirRelatorio = (token: string) => {
    window.open(`/relatorio/${token}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Relatórios Públicos</h2>
          <p className="text-neutral-400">Gerencie links públicos para compartilhar relatórios com clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-800 border-neutral-700">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Relatório Público</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Configure um novo relatório público para compartilhar com clientes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-neutral-300">
                  Título do Relatório
                </Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  placeholder="Ex: Relatório Mensal - Janeiro 2024"
                />
              </div>

              <div>
                <Label htmlFor="descricao" className="text-neutral-300">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  placeholder="Descrição do relatório..."
                />
              </div>

              <div>
                <Label htmlFor="cliente" className="text-neutral-300">
                  Cliente
                </Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => setFormData({ ...formData, cliente_id: value })}
                >
                  <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-700 border-neutral-600">
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id} className="text-white">
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expira_em" className="text-neutral-300">
                  Data de Expiração (opcional)
                </Label>
                <Input
                  id="expira_em"
                  type="datetime-local"
                  value={formData.expira_em}
                  onChange={(e) => setFormData({ ...formData, expira_em: e.target.value })}
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo" className="text-neutral-300">
                  Ativo
                </Label>
              </div>

              <Button onClick={criarRelatorio} className="w-full bg-orange-500 hover:bg-orange-600">
                Criar Relatório
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {relatorios.length === 0 ? (
          <Card className="bg-neutral-800 border-neutral-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Share2 className="h-12 w-12 text-neutral-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Nenhum relatório público</h3>
              <p className="text-neutral-400 text-center mb-4">
                Crie seu primeiro relatório público para compartilhar com clientes
              </p>
            </CardContent>
          </Card>
        ) : (
          relatorios.map((relatorio) => (
            <Card key={relatorio.id} className="bg-neutral-800 border-neutral-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-white">{relatorio.titulo}</CardTitle>
                    <CardDescription className="text-neutral-400">{relatorio.descricao}</CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {relatorio.cliente.nome}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(relatorio.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={relatorio.ativo ? "default" : "secondary"}>
                      {relatorio.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    {relatorio.expira_em && (
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                        Expira em {new Date(relatorio.expira_em).toLocaleDateString("pt-BR")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copiarLink(relatorio.token)}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirRelatorio(relatorio.token)}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={relatorio.ativo}
                      onCheckedChange={(checked) => toggleStatus(relatorio.id, checked)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirRelatorio(relatorio.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
