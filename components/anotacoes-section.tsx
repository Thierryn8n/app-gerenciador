"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Plus, Edit3, Trash2, Save, X, MessageSquare, Calendar } from "lucide-react"

interface Anotacao {
  id: string
  usuario_id: string
  cliente_id?: string
  campanha_id?: string
  titulo?: string
  conteudo: string
  cor: string
  created_at: string
  updated_at: string
}

interface AnotacoesSectionProps {
  clienteId?: string
  campanhaId?: string
  titulo: string
}

const cores = [
  { value: "neutral", label: "Neutro", class: "bg-neutral-500/20 text-neutral-400" },
  { value: "blue", label: "Azul", class: "bg-blue-500/20 text-blue-400" },
  { value: "green", label: "Verde", class: "bg-green-500/20 text-green-400" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500/20 text-yellow-400" },
  { value: "red", label: "Vermelho", class: "bg-red-500/20 text-red-400" },
  { value: "purple", label: "Roxo", class: "bg-purple-500/20 text-purple-400" },
]

export function AnotacoesSection({ clienteId, campanhaId, titulo }: AnotacoesSectionProps) {
  const { usuario } = useAuth()
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([])
  const [loading, setLoading] = useState(true)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [novaAnotacao, setNovaAnotacao] = useState({
    titulo: "",
    conteudo: "",
    cor: "neutral",
  })
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  useEffect(() => {
    if (usuario) {
      fetchAnotacoes()
    }
  }, [usuario, clienteId, campanhaId])

  const fetchAnotacoes = async () => {
    try {
      let query = supabase
        .from("anotacoes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false })

      if (clienteId) {
        query = query.eq("cliente_id", clienteId)
      }
      if (campanhaId) {
        query = query.eq("campanha_id", campanhaId)
      }

      const { data, error } = await query

      if (error) throw error
      setAnotacoes(data || [])
    } catch (error) {
      console.error("Erro ao buscar anotações:", error)
    } finally {
      setLoading(false)
    }
  }

  const salvarAnotacao = async () => {
    if (!novaAnotacao.conteudo.trim()) return

    try {
      const dadosAnotacao = {
        usuario_id: usuario?.id,
        cliente_id: clienteId || null,
        campanha_id: campanhaId || null,
        titulo: novaAnotacao.titulo.trim() || null,
        conteudo: novaAnotacao.conteudo.trim(),
        cor: novaAnotacao.cor,
      }

      const { data, error } = await supabase.from("anotacoes").insert([dadosAnotacao]).select().single()

      if (error) throw error

      setAnotacoes([data, ...anotacoes])
      setNovaAnotacao({ titulo: "", conteudo: "", cor: "neutral" })
      setMostrarFormulario(false)
    } catch (error) {
      console.error("Erro ao salvar anotação:", error)
    }
  }

  const editarAnotacao = async (id: string, dados: Partial<Anotacao>) => {
    try {
      const { data, error } = await supabase.from("anotacoes").update(dados).eq("id", id).select().single()

      if (error) throw error

      setAnotacoes(anotacoes.map((a) => (a.id === id ? data : a)))
      setEditandoId(null)
    } catch (error) {
      console.error("Erro ao editar anotação:", error)
    }
  }

  const excluirAnotacao = async (id: string) => {
    try {
      const { error } = await supabase.from("anotacoes").delete().eq("id", id)

      if (error) throw error

      setAnotacoes(anotacoes.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Erro ao excluir anotação:", error)
    }
  }

  const getCorClass = (cor: string) => {
    return cores.find((c) => c.value === cor)?.class || cores[0].class
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-neutral-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            ANOTAÇÕES - {titulo}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Anotação
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário de Nova Anotação */}
        {mostrarFormulario && (
          <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-600 space-y-3">
            <Input
              placeholder="Título (opcional)"
              value={novaAnotacao.titulo}
              onChange={(e) => setNovaAnotacao({ ...novaAnotacao, titulo: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white"
            />
            <Textarea
              placeholder="Escreva sua anotação..."
              value={novaAnotacao.conteudo}
              onChange={(e) => setNovaAnotacao({ ...novaAnotacao, conteudo: e.target.value })}
              className="bg-neutral-800 border-neutral-600 text-white min-h-[80px]"
            />
            <div className="flex items-center justify-between">
              <Select value={novaAnotacao.cor} onValueChange={(cor) => setNovaAnotacao({ ...novaAnotacao, cor })}>
                <SelectTrigger className="w-32 bg-neutral-800 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  {cores.map((cor) => (
                    <SelectItem key={cor.value} value={cor.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cor.class}`}></div>
                        {cor.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setMostrarFormulario(false)
                    setNovaAnotacao({ titulo: "", conteudo: "", cor: "neutral" })
                  }}
                  className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={salvarAnotacao}
                  disabled={!novaAnotacao.conteudo.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Anotações */}
        <div className="space-y-3">
          {anotacoes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma anotação encontrada</p>
              <p className="text-sm">Adicione sua primeira anotação para começar</p>
            </div>
          ) : (
            anotacoes.map((anotacao) => (
              <AnotacaoItem
                key={anotacao.id}
                anotacao={anotacao}
                editando={editandoId === anotacao.id}
                onEditar={() => setEditandoId(anotacao.id)}
                onSalvar={(dados) => editarAnotacao(anotacao.id, dados)}
                onCancelar={() => setEditandoId(null)}
                onExcluir={() => excluirAnotacao(anotacao.id)}
                getCorClass={getCorClass}
                formatarData={formatarData}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AnotacaoItemProps {
  anotacao: Anotacao
  editando: boolean
  onEditar: () => void
  onSalvar: (dados: Partial<Anotacao>) => void
  onCancelar: () => void
  onExcluir: () => void
  getCorClass: (cor: string) => string
  formatarData: (data: string) => string
}

function AnotacaoItem({
  anotacao,
  editando,
  onEditar,
  onSalvar,
  onCancelar,
  onExcluir,
  getCorClass,
  formatarData,
}: AnotacaoItemProps) {
  const [dadosEdicao, setDadosEdicao] = useState({
    titulo: anotacao.titulo || "",
    conteudo: anotacao.conteudo,
    cor: anotacao.cor,
  })

  if (editando) {
    return (
      <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-600 space-y-3">
        <Input
          placeholder="Título (opcional)"
          value={dadosEdicao.titulo}
          onChange={(e) => setDadosEdicao({ ...dadosEdicao, titulo: e.target.value })}
          className="bg-neutral-800 border-neutral-600 text-white"
        />
        <Textarea
          value={dadosEdicao.conteudo}
          onChange={(e) => setDadosEdicao({ ...dadosEdicao, conteudo: e.target.value })}
          className="bg-neutral-800 border-neutral-600 text-white min-h-[80px]"
        />
        <div className="flex items-center justify-between">
          <Select value={dadosEdicao.cor} onValueChange={(cor) => setDadosEdicao({ ...dadosEdicao, cor })}>
            <SelectTrigger className="w-32 bg-neutral-800 border-neutral-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-800 border-neutral-600">
              {cores.map((cor) => (
                <SelectItem key={cor.value} value={cor.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cor.class}`}></div>
                    {cor.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onCancelar}
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => onSalvar(dadosEdicao)}
              disabled={!dadosEdicao.conteudo.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {anotacao.titulo && <h4 className="text-sm font-medium text-white">{anotacao.titulo}</h4>}
          <Badge className={getCorClass(anotacao.cor)}>{cores.find((c) => c.value === anotacao.cor)?.label}</Badge>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEditar}
            className="text-neutral-400 hover:text-orange-400 p-1 h-auto"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onExcluir}
            className="text-neutral-400 hover:text-red-400 p-1 h-auto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <p className="text-sm text-neutral-300 mb-3 whitespace-pre-wrap">{anotacao.conteudo}</p>
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Calendar className="w-3 h-3" />
        <span>{formatarData(anotacao.created_at)}</span>
        {anotacao.updated_at !== anotacao.created_at && (
          <span className="text-neutral-600">(editado em {formatarData(anotacao.updated_at)})</span>
        )}
      </div>
    </div>
  )
}
