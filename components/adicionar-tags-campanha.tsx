"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Plus, X, ChevronsUpDown } from "lucide-react"

interface TagCampanha {
  id: string
  nome: string
  cor: string
  descricao?: string
}

interface AdicionarTagsCampanhaProps {
  campanhaId: string
  campanhaName: string
  tagsAtuais: TagCampanha[]
  onTagsUpdated: (tags: TagCampanha[]) => void
}

// Sugestões inteligentes baseadas em palavras-chave
const SUGESTOES_TAGS = {
  "black friday": { nome: "Black Friday", cor: "#DC2626" },
  natal: { nome: "Natal", cor: "#059669" },
  "cyber monday": { nome: "Cyber Monday", cor: "#7C3AED" },
  "dia das mães": { nome: "Dia das Mães", cor: "#DB2777" },
  "dia dos pais": { nome: "Dia dos Pais", cor: "#2563EB" },
  conversao: { nome: "Conversão", cor: "#059669" },
  trafego: { nome: "Tráfego", cor: "#2563EB" },
  engajamento: { nome: "Engajamento", cor: "#EA580C" },
  retargeting: { nome: "Retargeting", cor: "#DB2777" },
  institucional: { nome: "Institucional", cor: "#059669" },
  promocao: { nome: "Promoção", cor: "#DC2626" },
  lancamento: { nome: "Lançamento", cor: "#7C3AED" },
}

export function AdicionarTagsCampanha({
  campanhaId,
  campanhaName,
  tagsAtuais,
  onTagsUpdated,
}: AdicionarTagsCampanhaProps) {
  const { usuario } = useAuth()
  const [open, setOpen] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [todasTags, setTodasTags] = useState<TagCampanha[]>([])
  const [sugestoes, setSugestoes] = useState<Array<{ nome: string; cor: string }>>([])
  const [novaTag, setNovaTag] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario && open) {
      fetchTags()
      gerarSugestoes()
    }
  }, [usuario, open, campanhaName])

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags_campanha")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("nome")

      if (error) throw error
      setTodasTags(data || [])
    } catch (error) {
      console.error("Erro ao buscar tags:", error)
    }
  }

  const gerarSugestoes = () => {
    const nomeMinusculo = campanhaName.toLowerCase()
    const sugestoesEncontradas: Array<{ nome: string; cor: string }> = []

    // Verificar palavras-chave no nome da campanha
    Object.entries(SUGESTOES_TAGS).forEach(([palavra, tag]) => {
      if (nomeMinusculo.includes(palavra)) {
        // Verificar se a tag já não existe
        const tagExiste =
          todasTags.some((t) => t.nome.toLowerCase() === tag.nome.toLowerCase()) ||
          tagsAtuais.some((t) => t.nome.toLowerCase() === tag.nome.toLowerCase())

        if (!tagExiste) {
          sugestoesEncontradas.push(tag)
        }
      }
    })

    setSugestoes(sugestoesEncontradas)
  }

  const adicionarTag = async (tagId: string) => {
    try {
      setLoading(true)

      const { error } = await supabase.from("campanhas_tags").insert({
        campanha_id: campanhaId,
        tag_id: tagId,
      })

      if (error) throw error

      const tagAdicionada = todasTags.find((t) => t.id === tagId)
      if (tagAdicionada) {
        onTagsUpdated([...tagsAtuais, tagAdicionada])
      }
    } catch (error) {
      console.error("Erro ao adicionar tag:", error)
      alert("Erro ao adicionar tag")
    } finally {
      setLoading(false)
    }
  }

  const removerTag = async (tagId: string) => {
    try {
      setLoading(true)

      const { error } = await supabase.from("campanhas_tags").delete().eq("campanha_id", campanhaId).eq("tag_id", tagId)

      if (error) throw error

      onTagsUpdated(tagsAtuais.filter((t) => t.id !== tagId))
    } catch (error) {
      console.error("Erro ao remover tag:", error)
      alert("Erro ao remover tag")
    } finally {
      setLoading(false)
    }
  }

  const criarESelecionarTag = async (sugestao: { nome: string; cor: string }) => {
    try {
      setLoading(true)

      // Criar a tag
      const { data: novaTagData, error: createError } = await supabase
        .from("tags_campanha")
        .insert({
          usuario_id: usuario?.id,
          nome: sugestao.nome,
          cor: sugestao.cor,
        })
        .select()
        .single()

      if (createError) throw createError

      // Adicionar à campanha
      const { error: linkError } = await supabase.from("campanhas_tags").insert({
        campanha_id: campanhaId,
        tag_id: novaTagData.id,
      })

      if (linkError) throw linkError

      // Atualizar estados
      setTodasTags([...todasTags, novaTagData])
      onTagsUpdated([...tagsAtuais, novaTagData])
      setSugestoes(sugestoes.filter((s) => s.nome !== sugestao.nome))
    } catch (error: any) {
      console.error("Erro ao criar e adicionar tag:", error)
      if (error.code === "23505") {
        alert("Já existe uma tag com este nome")
      } else {
        alert("Erro ao criar tag")
      }
    } finally {
      setLoading(false)
    }
  }

  const criarTagPersonalizada = async () => {
    if (!novaTag.trim()) return

    try {
      setLoading(true)

      const { data: novaTagData, error: createError } = await supabase
        .from("tags_campanha")
        .insert({
          usuario_id: usuario?.id,
          nome: novaTag.trim(),
          cor: "#3B82F6",
        })
        .select()
        .single()

      if (createError) throw createError

      const { error: linkError } = await supabase.from("campanhas_tags").insert({
        campanha_id: campanhaId,
        tag_id: novaTagData.id,
      })

      if (linkError) throw linkError

      setTodasTags([...todasTags, novaTagData])
      onTagsUpdated([...tagsAtuais, novaTagData])
      setNovaTag("")
    } catch (error: any) {
      console.error("Erro ao criar tag personalizada:", error)
      if (error.code === "23505") {
        alert("Já existe uma tag com este nome")
      } else {
        alert("Erro ao criar tag")
      }
    } finally {
      setLoading(false)
    }
  }

  const tagsDisponiveis = todasTags.filter((tag) => !tagsAtuais.some((tagAtual) => tagAtual.id === tag.id))

  return (
    <div className="space-y-2">
      {/* Tags Atuais */}
      <div className="flex flex-wrap gap-2">
        {tagsAtuais.map((tag) => (
          <Badge
            key={tag.id}
            style={{
              backgroundColor: `${tag.cor}20`,
              borderColor: `${tag.cor}50`,
              color: tag.cor,
            }}
            className="flex items-center gap-1 pr-1"
          >
            {tag.nome}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removerTag(tag.id)}
              disabled={loading}
              className="h-4 w-4 p-0 hover:bg-transparent"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Botão para Adicionar Tags */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar Tags
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-neutral-800 border-neutral-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Gerenciar Tags da Campanha</DialogTitle>
            <DialogDescription className="text-neutral-400">{campanhaName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Sugestões Inteligentes */}
            {sugestoes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Sugestões Inteligentes</h4>
                <div className="flex flex-wrap gap-2">
                  {sugestoes.map((sugestao, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => criarESelecionarTag(sugestao)}
                      disabled={loading}
                      className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                      style={{ borderColor: `${sugestao.cor}50` }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {sugestao.nome}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Selecionar Tag Existente */}
            {tagsDisponiveis.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Tags Existentes</h4>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-full justify-between bg-neutral-700 border-neutral-600 text-white"
                    >
                      Selecionar tag...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 bg-neutral-800 border-neutral-600">
                    <Command className="bg-neutral-800">
                      <CommandInput placeholder="Buscar tag..." className="bg-neutral-800 text-white" />
                      <CommandList>
                        <CommandEmpty className="text-neutral-400">Nenhuma tag encontrada.</CommandEmpty>
                        <CommandGroup className="max-h-48 overflow-y-auto">
                          {tagsDisponiveis.map((tag) => (
                            <CommandItem
                              key={tag.id}
                              onSelect={() => {
                                adicionarTag(tag.id)
                                setPopoverOpen(false)
                              }}
                              className="text-white hover:bg-neutral-700"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.cor }} />
                                {tag.nome}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Criar Nova Tag */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white">Criar Nova Tag</h4>
              <div className="flex gap-2">
                <Input
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  placeholder="Nome da nova tag"
                  className="bg-neutral-700 border-neutral-600 text-white"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      criarTagPersonalizada()
                    }
                  }}
                />
                <Button
                  onClick={criarTagPersonalizada}
                  disabled={!novaTag.trim() || loading}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tags Atuais da Campanha */}
            {tagsAtuais.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">Tags da Campanha</h4>
                <div className="flex flex-wrap gap-2">
                  {tagsAtuais.map((tag) => (
                    <Badge
                      key={tag.id}
                      style={{
                        backgroundColor: `${tag.cor}20`,
                        borderColor: `${tag.cor}50`,
                        color: tag.cor,
                      }}
                      className="flex items-center gap-1 pr-1"
                    >
                      {tag.nome}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removerTag(tag.id)}
                        disabled={loading}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
