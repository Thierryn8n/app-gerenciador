"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Edit, Trash2, Tag, Palette } from "lucide-react"

const CORES_PREDEFINIDAS = [
  "#DC2626",
  "#EA580C",
  "#D97706",
  "#CA8A04",
  "#65A30D",
  "#16A34A",
  "#059669",
  "#0891B2",
  "#0284C7",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#9333EA",
  "#C026D3",
  "#DB2777",
]

interface TagCampanha {
  id: string
  nome: string
  cor: string
  descricao?: string
  created_at: string
}

export function GerenciarTags() {
  const { usuario } = useAuth()
  const [tags, setTags] = useState<TagCampanha[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<TagCampanha | null>(null)
  const [formData, setFormData] = useState({
    nome: "",
    cor: "#3B82F6",
    descricao: "",
  })

  useEffect(() => {
    if (usuario) {
      fetchTags()
    }
  }, [usuario])

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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTag = async () => {
    if (!formData.nome.trim()) {
      alert("Nome da tag é obrigatório")
      return
    }

    try {
      const { data, error } = await supabase
        .from("tags_campanha")
        .insert({
          usuario_id: usuario?.id,
          nome: formData.nome.trim(),
          cor: formData.cor,
          descricao: formData.descricao.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setTags([...tags, data])
      setShowCreateDialog(false)
      setFormData({ nome: "", cor: "#3B82F6", descricao: "" })
    } catch (error: any) {
      console.error("Erro ao criar tag:", error)
      if (error.code === "23505") {
        alert("Já existe uma tag com este nome")
      } else {
        alert("Erro ao criar tag")
      }
    }
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !formData.nome.trim()) return

    try {
      const { data, error } = await supabase
        .from("tags_campanha")
        .update({
          nome: formData.nome.trim(),
          cor: formData.cor,
          descricao: formData.descricao.trim() || null,
        })
        .eq("id", editingTag.id)
        .select()
        .single()

      if (error) throw error

      setTags(tags.map((tag) => (tag.id === editingTag.id ? data : tag)))
      setEditingTag(null)
      setFormData({ nome: "", cor: "#3B82F6", descricao: "" })
    } catch (error: any) {
      console.error("Erro ao atualizar tag:", error)
      if (error.code === "23505") {
        alert("Já existe uma tag com este nome")
      } else {
        alert("Erro ao atualizar tag")
      }
    }
  }

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tag? Ela será removida de todas as campanhas.")) return

    try {
      const { error } = await supabase.from("tags_campanha").delete().eq("id", id)

      if (error) throw error

      setTags(tags.filter((tag) => tag.id !== id))
    } catch (error) {
      console.error("Erro ao excluir tag:", error)
      alert("Erro ao excluir tag")
    }
  }

  const resetForm = () => {
    setFormData({ nome: "", cor: "#3B82F6", descricao: "" })
    setEditingTag(null)
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wider">GERENCIAR TAGS</h2>
          <p className="text-sm text-neutral-400">Crie e organize tags para categorizar suas campanhas</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-800 border-neutral-700 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Nova Tag</DialogTitle>
              <DialogDescription className="text-neutral-400">
                Crie uma nova tag para organizar suas campanhas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-neutral-300">
                  Nome da Tag *
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Black Friday, Conversão, Tráfego"
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-neutral-300">Cor da Tag</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <button
                      key={cor}
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.cor === cor ? "border-white" : "border-neutral-600"
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-full h-10 bg-neutral-700 border-neutral-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-neutral-300">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição opcional da tag"
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTag} className="bg-orange-500 hover:bg-orange-600">
                  Criar Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    resetForm()
                  }}
                  className="border-neutral-600 text-neutral-300"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.length === 0 ? (
          <Card className="col-span-full bg-neutral-800 border-neutral-700">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhuma tag criada</h3>
              <p className="text-neutral-400 mb-4">Crie tags para organizar e categorizar suas campanhas</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Tag
              </Button>
            </CardContent>
          </Card>
        ) : (
          tags.map((tag) => (
            <Card key={tag.id} className="bg-neutral-800 border-neutral-700">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      style={{
                        backgroundColor: `${tag.cor}20`,
                        borderColor: `${tag.cor}50`,
                        color: tag.cor,
                      }}
                      className="text-sm font-medium"
                    >
                      {tag.nome}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingTag(tag)
                          setFormData({
                            nome: tag.nome,
                            cor: tag.cor,
                            descricao: tag.descricao || "",
                          })
                        }}
                        className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {tag.descricao && <p className="text-sm text-neutral-400">{tag.descricao}</p>}

                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Palette className="w-3 h-3" />
                    {tag.cor}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Edição */}
      <Dialog
        open={!!editingTag}
        onOpenChange={() => {
          setEditingTag(null)
          resetForm()
        }}
      >
        <DialogContent className="bg-neutral-800 border-neutral-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Tag</DialogTitle>
            <DialogDescription className="text-neutral-400">Atualize as informações da tag</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome" className="text-neutral-300">
                Nome da Tag *
              </Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-neutral-700 border-neutral-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-neutral-300">Cor da Tag</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {CORES_PREDEFINIDAS.map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setFormData({ ...formData, cor })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.cor === cor ? "border-white" : "border-neutral-600"
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                className="w-full h-10 bg-neutral-700 border-neutral-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descricao" className="text-neutral-300">
                Descrição
              </Label>
              <Textarea
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="bg-neutral-700 border-neutral-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateTag} className="bg-orange-500 hover:bg-orange-600">
                Salvar Alterações
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTag(null)
                  resetForm()
                }}
                className="border-neutral-600 text-neutral-300"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
